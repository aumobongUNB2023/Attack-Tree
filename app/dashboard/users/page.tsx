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

export default async function page() {
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
      } else {
        console.log('Failed to fetch users');
      }
    };
    fetchUsers();
  }, [deleting]);
  // const users = await getAllUser();

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
    setDeleting(true);
    console.log(user);
  };

  const onClose = () => {
    setShowModal(false);
    setSelectedUser(null);
    setEditing(false);
    setDeleting(false);
    setCreating(false);
  };

  const createModal = (user?: User) => {
    setEditing(false);
    setCreating(!creating);
    setSelectedUser(user ?? ({} as User));
    setShowModal(true);
  };

  //const router = useRouter();
  //console.log(users);

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
                    console.log('clicked deleting ', selectedUser, showModal);
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
        <Dialog
          open={showModal}
          onClose={() => setShowModal(false)}
          className="fixed inset-0 z-10 overflow-y-auto"
          style={{
            display: 'flex',
            justifyContent: 'center',
            top: '50px',
          }}
        >
          <Dialog.Title>Delete User</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to delete: {selectedUser?.name}?
          </Dialog.Description>
          <div>
            <button
              onClick={() => {
                setDeleting(true);
                setShowModal(false);
                console.log('deleting user', selectedUser, showModal);
                deleteUser(selectedUser.id).then(() => {
                  window.location.reload(); // eslint-disable-line no-restricted-globals
                });
              }}
              disabled={deleting}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Yes
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
