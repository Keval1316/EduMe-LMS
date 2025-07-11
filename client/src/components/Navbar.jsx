// import React from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import useAuthStore from '../store/authStore';
// import apiClient from '../api/axiosConfig';

// const Navbar = () => {
//     const { isAuthenticated, logout, user } = useAuthStore();
//     const navigate = useNavigate();

//     const handleLogout = async () => {
//         try {
//             await apiClient.post('/logout');
//             logout();
//             navigate('/login');
//         } catch (error) {
//             console.error('Logout failed:', error);
//             // Still log out on the client even if server call fails
//             logout();
//             navigate('/login');
//         }
//     };

//     return (
//         <nav className="bg-white shadow-md">
//             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//                 <div className="flex items-center justify-between h-16">
//                     <div className="flex items-center">
//                         <Link to="/" className="text-2xl font-bold text-indigo-600">LMS</Link>
//                     </div>
//                     <div className="flex items-center">
//                         {isAuthenticated ? (
//                             <>
//                                 <span className="text-gray-700 mr-4">Welcome, {user?.name}!</span>
//                                 <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
//                                 <button onClick={handleLogout} className="ml-4 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
//                                     Logout
//                                 </button>
//                             </>
//                         ) : (
//                             <>
//                                 <Link to="/login" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Login</Link>
//                                 <Link to="/signup" className="ml-4 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">Sign Up</Link>
//                             </>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </nav>
//     );
// };

// export default Navbar;

import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a href="#home" className="flex items-center space-x-3 rtl:space-x-reverse">
          <img src="https://flowbite.com/docs/images/logo.svg" className="h-8" alt="Logo" />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">EduMe</span>
        </a>
        <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          <Link to="/signup">
            <button
              type="button"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Get started
            </button>
          </Link>
        </div>
        <div
          className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
          id="navbar-sticky"
        >
          <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            <li>
              <a href="#home" className="block py-2 px-3 text-blue-700 dark:text-blue-500">Home</a>
            </li>
            <li>
              <a href="#about" className="block py-2 px-3 text-gray-900 dark:text-white hover:text-blue-700">About</a>
            </li>
            <li>
              <a href="#services" className="block py-2 px-3 text-gray-900 dark:text-white hover:text-blue-700">Services</a>
            </li>
            <li>
              <a href="#contact" className="block py-2 px-3 text-gray-900 dark:text-white hover:text-blue-700">Contact</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

