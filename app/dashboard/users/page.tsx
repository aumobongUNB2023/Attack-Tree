'use client';
import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import {
  getAllUser,
  createUser,
  deleteUser,
  updateUser,
} from '@/app/lib/actions';
import { User } from '@/app/lib/definitions';
import { Dialog } from '@headlessui/react';

import { useState, useEffect } from 'react';
import { CreateUser } from '@/app/ui/invoices/buttons';
//import { useRouter } from 'next/router';
//import '@reach/dialog/styles.css';

export default async function page(req: NextApiRequest, res: NextApiResponse) {
  // get all user from the database

  // call users in use effect  to populate data when first loaded
  const [users, setUsers] = useState<Array<User>>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await getAllUser();
      if (users) {
        setUsers(users as User[]);
      }
    };
    fetchUsers();
  }, []);
  // const users = await getAllUser();

  //  if there is an error while fetching user data, send a status of 400 and json
  if (!users || !Array.isArray(users)) {
    return res.status(401).send('Failed to load users');
  }

  const createModal = (user?: User) => {
    setEditing(false);
    setCreating(!creating);
    setSelectedUser(user ?? ({} as User));
    setShowModal(true);
  };

  //const router = useRouter();
  console.log(users);

  // user display page in a table manner
  return (
    <div className="mx-auto px-4 py-16">
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <h1 className="my-5 text-4xl font-medium">Users</h1>
        <CreateUser />
      </div>
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
              <td className="grid-cols-2-auto grid content-center gap-4 px-6 py-4 text-center text-sm font-medium">
                <button className="text-blue-500 hover:underline">Edit</button>
                <button
                  className="text-red-500 hover:underline"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowModal(true);
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedUser && (
        <Dialog open={showModal} onClose={() => setShowModal(false)}>
          <Dialog.Title>Delete User</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to delete {selectedUser.name}?
          </Dialog.Description>
          <button
            onClick={() => {
              setDeleting(true);
              setShowModal(false);
            }}
            disabled={deleting}
          >
            Yes
          </button>
          <button onClick={() => setShowModal(false)}>No</button>
        </Dialog>
      )}
    </div>
  );
}
