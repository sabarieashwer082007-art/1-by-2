
import React, { useCallback, useEffect, useState } from 'react';
import { auth } from '../../lib/firebase';

interface ClientEmail {
  id: string;
  to: string;
  clientName?: string;
  subject: string;
  body: string;
  bookingId?: string;
  status?: string;
  success?: boolean;
  sentBy?: string;
  sentAt?: string;
}

export const AdminClientEmails: React.FC = () => {
  const [to, setTo] = useState('');
  const [clientName, setClientName] = useState('');
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [body, setBody] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [tone, setTone] = useState('professional');

  const [emails, setEmails] = useState<ClientEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const getToken = async () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Please sign in as an administrator first.');
    }
    return user.getIdToken();
  };

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/client-emails', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not load email history.');
      }

      setEmails(data.emails || []);
    } catch (err: any) {
      setError(err.message || 'Could not load email history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const generateDraft = async () => {
    setError('');
    setNotice('');

    if (!question.trim()) {
      setError('Enter what you want to ask the client first.');
      return;
    }

    setGenerating(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/client-emails/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientName,
          question,
          bookingDetails: bookingId ? `Booking ID: ${bookingId}` : '',
          tone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not generate an AI draft.');
      }

      setBody(data.draft);
      setNotice('AI draft created. Review and edit it before sending.');
    } catch (err: any) {
      setError(err.message || 'Could not generate an AI draft.');
    } finally {
      setGenerating(false);
    }
  };

  const sendEmail = async () => {
    setError('');
    setNotice('');

    if (!to.trim() || !subject.trim() || !body.trim()) {
      setError('Enter the client email, subject, and message before sending.');
      return;
    }

    if (!window.confirm(`Send this email to ${to.trim()}?`)) {
      return;
    }

    setSending(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/client-emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to,
          clientName,
          subject,
          body,
          bookingId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'The email could not be sent.');
      }

      setNotice(data.message || 'Email sent successfully.');
      setSubject('');
      setQuestion('');
      setBody('');
      await loadHistory();
    } catch (err: any) {
      setError(err.message || 'The email could not be sent.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Client Emails</h1>
        <p className="mt-1 text-sm text-gray-600">
          Contact clients, prepare AI-assisted drafts, and review sent email history.
        </p>
      </div>

      {notice && (
        <div role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {notice}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Compose an email
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Client name
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
              placeholder="Client name"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Client email
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
              placeholder="client@example.com"
              required
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Booking ID (optional)
            <input
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
              placeholder="Related booking ID"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            AI writing tone
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
            </select>
          </label>
        </div>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          What do you want to ask the client?
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            maxLength={3000}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3"
            placeholder="For example: Ask the client to confirm their preferred photoshoot time."
          />
        </label>

        <button
          type="button"
          onClick={generateDraft}
          disabled={generating || sending}
          className="mt-3 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-800 disabled:opacity-50"
        >
          {generating ? 'Generating draft...' : 'Generate AI draft'}
        </button>

        <label className="mt-5 block text-sm font-medium text-gray-700">
          Email subject
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
            className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"
            placeholder="Enter the email subject"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Email message
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            maxLength={10000}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3"
            placeholder="Write your message or generate an AI draft above."
          />
        </label>

        <button
          type="button"
          onClick={sendEmail}
          disabled={sending || generating}
          className="mt-4 rounded-lg bg-gray-900 px-5 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Review and send email'}
        </button>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Email history</h2>
            <p className="text-sm text-gray-600">
              Recent custom email attempts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadHistory()}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {emails.length === 0 && !loading ? (
          <p className="mt-4 text-sm text-gray-600">
            No custom email history found yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {emails.map((email) => (
              <article key={email.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{email.subject}</h3>
                    <p className="text-sm text-gray-600">
                      {email.clientName || 'Client'} · {email.to}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      email.success
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {email.success ? 'Sent' : email.status || 'Failed'}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                  {email.body}
                </p>
                {email.sentAt && (
                  <p className="mt-2 text-xs text-gray-500">
                    {new Date(email.sentAt).toLocaleString()}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
