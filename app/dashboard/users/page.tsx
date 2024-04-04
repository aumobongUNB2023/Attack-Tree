import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import {
  getAllUser,
  createUser,
  deleteUser,
  updateUser,
} from '@/app/lib/actions';
import { User } from '@/app/lib/definitions';

/* export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    const result =
      await sql`CREATE TABLE Pets ( Name varchar(255), Owner varchar(255) );`;
    return response.status(200).json({ result });
  } catch (error) {
    return response.status(500).json({ error });
  }
} */

export default async function page(req: NextApiRequest, res: NextApiResponse) {
  // get all user from the database
  const users = await getAllUser();

  //  if there is an error while fetching user data, send a status of 400 and json
  if (!users || !Array.isArray(users)) {
    return res.status(401).send('Failed to load users');
  }
  console.log(users);

  // user display page in a table manner
  return (
    <div className="mx-auto px-4 py-16">
      <h1 className="my-5 text-4xl font-medium">Users</h1>
      <table className="w-full table-auto">
        <thead className="rounded-lg text-left text-sm font-normal">
          <tr>
            <th className="border border-gray-500 px-6 py-3 text-xs font-medium uppercase tracking-widest text-gray-900">
              Full Name
            </th>
            <th className="border border-gray-500 px-6 py-3 text-xs font-medium uppercase tracking-widest text-gray-900">
              Email
            </th>
            <th className="border border-gray-500 px-6 py-3 text-xs font-medium uppercase tracking-widest text-gray-900">
              Admin
            </th>
            <th className="border border-gray-500 px-6 py-3 text-xs font-medium uppercase tracking-widest text-gray-900">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {/* Map through each user and create a row for them */}
          {users.map((user) => (
            <tr
              key={user.id}
              className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
            >
              <td className="whitespace-nowrap py-3 pl-6 pr-3">{user.name}</td>
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-center ">
                {user.email}
              </td>
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-center ">
                {user.isadmin ? 'Yes' : 'No'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
