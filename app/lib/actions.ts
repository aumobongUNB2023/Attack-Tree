'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
//----user
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
//import { hashPassword } from './utils'; // Import the hashPassword function

const hashPassword = async (password: string | undefined) => {
  if (!password) {
    throw new Error('Password is required.');
  }
  const passwordBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
};
// ----------------- invoice related --------------------
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

// this is the invoice validation schema, this ensure that the input fields are valid and safe
const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

// the user schema for updating and creating users
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
});

const CreateInvoice = InvoiceSchema.omit({ id: true, date: true });
const UpdateInvoice = InvoiceSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  console.log(validatedFields);
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
  //const { customerId, amount, status } = CreateInvoice.parse({rawFormData});
  // Test it out:
  //console.log(rawFormData);
}

// Use Zod to update the expected types

// ...

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}

// ----------------- customer related --------------------

// ------------------ user related -----------------------
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function getAllUser() {
  const result = await sql`SELECT * FROM users`;
  return result.rows;
}

export async function getUserById(id: string) {
  const result = await sql`SELECT * FROM users WHERE id = ${id}`;
  return result.rows[0];
}

export async function createUser(formData: FormData) {
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const hashedPassword = await hashPassword(password); // Use the hashPassword function to hash the password

  try {
    const result = await sql`
        INSERT INTO users (email, password)
        VALUES (${email}, ${hashedPassword})
        RETURNING *; // Returns the inserted user data
    `;
    return { message: 'User created successfully.', user: result.rows[0] };
  } catch (error) {
    console.error('Create user error:', error);
    return { message: 'Failed to create user.' };
  }
}

export async function updateUser(id: string, formData: FormData) {
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const hashedPassword = await hashPassword(password);

  try {
    const result = await sql`
      UPDATE users
      SET email = ${email}, password = ${hashedPassword}
      WHERE id = ${id}
      RETURNING *; // Returns the updated user data
    `;
    return { message: 'User updated successfully.', user: result.rows[0] };
  } catch (error) {
    console.error('Update user error:', error);
    return { message: 'Failed to update user.' };
  }
}

export async function deleteUser(id: string) {
  try {
    await sql`
      DELETE FROM users WHERE id = ${id};
    `;
    return { message: 'User deleted successfully.' };
  } catch (error) {
    console.error('Delete user error:', error);
    return { message: 'Failed to delete user.' };
  }
}
