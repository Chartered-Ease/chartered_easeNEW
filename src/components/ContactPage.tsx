import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LoaderIcon } from './icons/LoaderIcon';

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
);

const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
  </svg>
);

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a3 3 0 100-6 3 3 0 000 6z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7-7.5 11-7.5 11s-7.5-4-7.5-11a7.5 7.5 0 1115 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const supportCards = [
  {
    title: 'General Inquiries',
    value: 'aashray@charteredease.in',
    detail: 'For compliance questions, service guidance and account help.',
    icon: MailIcon,
    tone: 'bg-blue-50 text-ease-blue',
    href: 'mailto:aashray@charteredease.in',
  },
  {
    title: 'Instant Support',
    value: 'Chat on WhatsApp',
    detail: 'Fastest way to share urgent filing or document queries.',
    icon: MessageIcon,
    tone: 'bg-emerald-50 text-emerald-700',
    href: 'https://wa.me/917477282139',
  },
  {
    title: 'Registered Address',
    value: 'Pune, India',
    detail: 'Digital compliance operations for Indian businesses.',
    icon: LocationIcon,
    tone: 'bg-purple-50 text-ease-purple',
  },
];

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    topic: 'Service Support',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      console.log('Form submitted:', formData);
    }, 900);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-ease-bg px-4 py-10 sm:px-6">
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-card mx-auto max-w-3xl overflow-hidden text-center">
          <div className="mesh-surface px-6 py-12 text-white">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">Message Received</p>
            <h1 className="mt-3 font-display text-4xl font-bold">We will get back shortly</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-blue-100">
              Your query is in the Chartered Ease support queue. For urgent filings, WhatsApp remains the fastest channel.
            </p>
          </div>
          <div className="flex flex-col gap-3 p-6 sm:flex-row sm:justify-center">
            <button onClick={() => setIsSubmitted(false)} className="blue-glow-button">Send Another Message</button>
            <a href="https://wa.me/917477282139" target="_blank" rel="noopener noreferrer" className="soft-button bg-white text-slate-900">Open WhatsApp</a>
          </div>
        </motion.section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
          <div className="mesh-surface relative p-6 text-white md:p-8">
            <div className="absolute right-8 top-8 hidden h-24 w-24 rounded-full border border-white/15 bg-white/10 blur-sm md:block" />
            <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">Contact Command Center</p>
                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Get compliance help without the waiting room</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                  Ask about filings, document requirements, status updates, partner onboarding or anything blocking your compliance workflow.
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-ease-blue">
                    <ClockIcon />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">Typical response</p>
                    <p className="text-2xl font-black text-white">Same business day</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="space-y-5">
            <div className="grid gap-4">
              {supportCards.map((card, index) => {
                const Icon = card.icon;
                const content = (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ y: -4 }}
                    className="glass-card group p-5 transition hover:border-ease-electric/30 hover:shadow-2xl"
                  >
                    <div className="flex gap-4">
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.tone}`}>
                        <Icon />
                      </span>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{card.title}</p>
                        <p className="mt-1 text-lg font-black text-slate-950 group-hover:text-ease-blue">{card.value}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{card.detail}</p>
                      </div>
                    </div>
                  </motion.div>
                );

                return card.href ? (
                  <a key={card.title} href={card.href} target={card.href.startsWith('http') ? '_blank' : undefined} rel={card.href.startsWith('http') ? 'noopener noreferrer' : undefined}>
                    {content}
                  </a>
                ) : (
                  <div key={card.title}>{content}</div>
                );
              })}
            </div>
          </aside>

          <motion.form initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} onSubmit={handleSubmit} className="glass-card overflow-hidden">
            <div className="border-b border-slate-100 bg-white/70 p-5 md:p-6">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Send a message</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Tell us what you need</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Add enough detail for us to route this to the right compliance desk.</p>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
              <label>
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Full Name</span>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="input" placeholder="Your name" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Email Address</span>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="input" placeholder="you@example.com" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Mobile Number</span>
                <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className="input" placeholder="Optional" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Topic</span>
                <select name="topic" value={formData.topic} onChange={handleChange} className="input">
                  <option>Service Support</option>
                  <option>Document Upload Help</option>
                  <option>Filing Status</option>
                  <option>Partner / Agent Onboarding</option>
                  <option>Pricing / Billing</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Message</span>
                <textarea name="message" rows={6} required value={formData.message} onChange={handleChange} className="input min-h-[170px]" placeholder="Tell us the service, entity type, urgency and what you need help with." />
              </label>
            </div>

            <div className="border-t border-slate-100 bg-white/70 p-5 md:p-6">
              <button type="submit" disabled={isSubmitting} className="blue-glow-button w-full disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? <LoaderIcon /> : 'Send Message'}
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
