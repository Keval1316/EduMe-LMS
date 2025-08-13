import React, { useState } from 'react';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const supportEmail = 'kevalc1316@gmail.com';

  const handleSubmit = (e) => {
    e.preventDefault();
    const encodedSubject = encodeURIComponent(subject || 'Contact from EduMe');
    const bodyLines = [
      message || '(No message provided)',
      '',
      `— From: ${name || 'Anonymous'}`,
      `Email: ${email || 'N/A'}`,
    ];
    const encodedBody = encodeURIComponent(bodyLines.join('\n'));
    window.location.href = `mailto:${supportEmail}?subject=${encodedSubject}&body=${encodedBody}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <section className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Contact Us</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
          We’re here to help. Whether you have a question about courses, pricing, features, or anything else,
          our team is ready to answer your questions.
        </p>
      </section>

      {/* Quick contact options */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900">Email</h3>
          <p className="mt-2 text-gray-600">Prefer email? Reach us anytime.</p>
          <a
            href={`mailto:${supportEmail}`}
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
          >
            {supportEmail}
          </a>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900">Support Hours</h3>
          <p className="mt-2 text-gray-600">Mon–Fri · 9:00–18:00 (IST)</p>
          <p className="text-gray-500 text-sm">We typically respond within 24 hours.</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900">Community</h3>
          <p className="mt-2 text-gray-600">Ask and collaborate in course Q&A.</p>
          <span className="inline-block mt-4 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium">In‑app Discussions</span>
        </div>
      </section>

      {/* Contact form */}
      <section className="bg-white rounded-xl shadow p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900">Send us a message</h2>
        <p className="mt-2 text-gray-600">Fill out the form and we’ll get back to you soon.</p>
        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 focus:ring-primary-600 focus:border-primary-600"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 focus:ring-primary-600 focus:border-primary-600"
                placeholder="your@email.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 focus:ring-primary-600 focus:border-primary-600"
              placeholder="How can we help?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              rows="5"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 focus:ring-primary-600 focus:border-primary-600"
              placeholder="Write your message..."
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">We’ll reach out to you at the email provided.</p>
            <button
              type="submit"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
            >
              Send Message
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Contact;
