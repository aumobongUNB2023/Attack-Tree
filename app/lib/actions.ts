'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath, unstable_noStore } from 'next/cache';
import { redirect } from 'next/navigation';
//----user
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcrypt';
//import { hashPassword } from './utils'; // Import the hashPassword function

const hashPassword = async (password: string | undefined) => {
  if (!password) {
    throw new Error('Password is required.');
  }
  /*   const passwordBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join(''); */
  const hashHex = await bcrypt.hash(password, 10);

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

export type UserState = {
  errors?: {
    name?: string[];
    password?: string[];
    email?: string[];
    isadmin?: string[];
  };
  message?: string | null;
};

// this is the invoice validation schema, this ensure that the input fields are valid and safe
const InvoiceSchema = z.object({
  id: z.string(), // needs to be better secured
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(), //needs to be better secured
});

// the user schema for updating and creating users using z for zod
const UserSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'name is required').max(100),
  email: z.string().trim().email('a valid email is required'),
  password: z.string().min(6, 'password must be at least 6 characters'),
  isadmin: z.union([z.literal('true'), z.literal('false')]),
});

const CreateUser = UserSchema.omit({ id: true }).transform((data) => {
  console.log('data', data);
  return {
    ...data,
    name: data.name.trim(), // cleans the data
    email: data.email.trim(), //cleans the data
    // convert admin to boolean
    isadmin: data.isadmin === 'true' ? true : false,
  };
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

export async function createUser(prevState: UserState, formInput: FormData) {
  let formData: any;

  if (formInput instanceof FormData) {
    formData = formInput;
  } else {
    formData = new FormData();
    Object.entries(formInput).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
  }
  let admin = formInput.get('isadmin') === 'true' ? 'true' : 'false';
  formInput.set('is_admin', admin);
  const userInfo = CreateUser.safeParse({
    name: formInput.get('name'),
    email: formInput.get('email'),
    password: formInput.get('password'),
    isadmin: admin,
  });
  console.log('User DATA', userInfo);
  // Check if form validation fails, return errors early. Otherwise, continue.
  if (!userInfo.success) {
    console.log('Validation failed.', userInfo.error);
    return {
      errors: userInfo.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create User.',
    };
  }

  // prepare data for insertion
  const { name, email, password, isadmin } = userInfo.data;
  console.log('User Info', name, email, password, isadmin);
  const hashedPassword = await hashPassword(password); // decided to use crypt

  try {
    const result = await sql`
        INSERT INTO users (name, email, password, isadmin)
        VALUES (${name}, ${email}, ${hashedPassword}, ${isadmin})         RETURNING *; 
    `;
  } catch (error) {
    console.error('Create user error:', error);
    return { message: 'Failed to create user.' };
  }

  revalidatePath('/dashboard/users');
  redirect('/dashboard/users');
}

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
  unstable_noStore();
  const result = await sql`SELECT * FROM users`;
  return result.rows;
}

export async function getUserById(id: string) {
  const result = await sql`SELECT * FROM users WHERE id = ${id}`;
  return result.rows[0];
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
