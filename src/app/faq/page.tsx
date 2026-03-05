'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FAQItem {
  q: string;
  a: string;
}

const faqs: FAQItem[] = [
  {
    q: 'What is CipherMeet?',
    a: 'CipherMeet is a privacy-first video calling platform. No accounts, no data collection, no recordings. Just encrypted, anonymous, ephemeral video calls that disappear the moment everyone leaves.',
  },
  {
    q: 'Is CipherMeet really end-to-end encrypted?',
    a: 'Yes. CipherMeet uses AES-128-GCM encryption via WebRTC Insertable Streams. Your video and audio are encrypted on your device before they ever reach our servers. The encryption key is shared through the room link (URL hash fragment), which is never sent to the server. We literally cannot see or hear your calls.',
  },
  {
    q: 'Do I need an account to use CipherMeet?',
    a: 'No. There are no accounts, no sign-ups, no emails, no phone numbers. You pick a display name when you join a room, and it disappears when you leave. We have zero knowledge of who you are.',
  },
  {
    q: 'Is any data stored on your servers?',
    a: 'No. Rooms exist only in server memory while active. The moment everyone leaves, the room and all its data are permanently destroyed. Chat messages, participant info, media streams \u2014 nothing is saved to disk, ever. There are no databases, no logs of who was in which room.',
  },
  {
    q: 'How many people can join a room?',
    a: 'Up to 30 participants per room. The quality automatically adjusts based on the number of participants and available bandwidth.',
  },
  {
    q: 'What happens when everyone leaves a room?',
    a: 'The room is immediately destroyed along with all associated data. Room codes cannot be reused. It is as if the room never existed.',
  },
  {
    q: 'Can I password-protect a room?',
    a: 'Yes. When creating a room, you can set a password. Anyone who wants to join will need to enter the correct password. Combined with E2E encryption, this gives you full control over who can access your call.',
  },
  {
    q: 'What browsers are supported?',
    a: 'CipherMeet works on Chrome, Edge, Firefox, and Safari. For the best experience and full E2E encryption support, we recommend Chrome or Edge. Mobile browsers are also supported.',
  },
  {
    q: 'How does the encryption key work?',
    a: 'When you create a room, a random encryption key is generated on your device. This key is appended to the room link as a URL hash fragment (the part after #). Hash fragments are never sent to the server \u2014 they stay in your browser. When you share the link, the recipient gets the key. The server never sees it.',
  },
  {
    q: 'Can CipherMeet be used for illegal activity?',
    a: 'CipherMeet is built for legitimate privacy needs: journalists protecting sources, activists in restrictive regions, businesses discussing sensitive matters, or anyone who values their privacy. We do not condone illegal use. Abuse protection measures are in place to prevent misuse of server resources.',
  },
  {
    q: 'Is CipherMeet open source?',
    a: 'The project is built with transparency in mind. The client-side encryption code runs entirely in your browser and can be inspected. We believe privacy tools should be verifiable.',
  },
  {
    q: 'How is CipherMeet funded?',
    a: 'CipherMeet is a passion project funded by donations. If you find it useful, consider donating to help cover server costs and keep the project alive. There are no ads, no tracking, and no monetization of user data \u2014 because there is no user data.',
  },
  {
    q: 'What makes CipherMeet different from Zoom or Google Meet?',
    a: 'Most video platforms require accounts, collect metadata, store recordings, and route unencrypted media through their servers. CipherMeet requires nothing, collects nothing, stores nothing, and encrypts everything end-to-end. Your call exists only in the moment.',
  },
  {
    q: 'Can I screen share?',
    a: 'Yes. CipherMeet supports screen sharing with the same E2E encryption applied to your screen share stream.',
  },
  {
    q: 'Is there a time limit on calls?',
    a: 'Rooms automatically expire after 2 hours of activity as a safety measure. Empty rooms are cleaned up after 5 minutes. There is no artificial time limit on active calls within that window.',
  },
  {
    q: 'Do you use cookies or trackers?',
    a: 'No. Zero cookies, zero analytics, zero tracking pixels, zero fingerprinting. We do not use Google Analytics, Facebook Pixel, or any third-party tracking. The site does not even have a favicon tracker.',
  },
];

function FAQAccordion({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
      >
        <span className="flex items-start gap-3">
          <span className="text-white/15 text-xs font-mono mt-0.5 shrink-0">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className={`text-sm font-light tracking-wide transition-colors ${open ? 'text-white/90' : 'text-white/50 group-hover:text-white/70'}`}>
            {item.q}
          </span>
        </span>
        <svg
          className={`w-4 h-4 shrink-0 mt-0.5 text-white/20 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96 pb-5' : 'max-h-0'}`}
      >
        <p className="text-white/30 text-sm font-light leading-relaxed pl-7 pr-4">
          {item.a}
        </p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black relative">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at top, transparent 0%, black 70%)',
      }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-16">
        {/* Back */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-white/25 hover:text-white/60 transition-colors text-xs tracking-[0.15em] uppercase group mb-16"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Project Goal Section */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
            <h2 className="text-[10px] text-white/30 tracking-[0.3em] uppercase">Project Goal</h2>
          </div>
          <div className="relative">
            <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 via-white/5 to-transparent rounded-2xl" />
            <div className="relative bg-black rounded-2xl p-8 space-y-4">
              <p className="text-white/50 text-sm font-light leading-relaxed">
                CipherMeet started with a simple frustration. Video calling shouldn&apos;t require an account, shouldn&apos;t store your conversations, and definitely shouldn&apos;t treat you like a product.
              </p>
              <p className="text-white/50 text-sm font-light leading-relaxed">
                The goal was to strip everything back down to what matters: you open a link, your people join, you talk, and when it&apos;s over it&apos;s gone. No trace, no data, no nonsense. We don&apos;t know who you are and honestly we don&apos;t want to. That&apos;s the whole point!
              </p>
              <p className="text-white/50 text-sm font-light leading-relaxed">
                We built CipherMeet for EVERYONE! Whether it&apos;s a quick call with a client, a meeting with your team or your gaming buddies. It should just work, it should be free, and it should respect your privacy.
              </p>
              <p className="text-white/50 text-sm font-light leading-relaxed">
                That&apos;s it. That&apos;s the whole mission.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
            <h2 className="text-[10px] text-white/30 tracking-[0.3em] uppercase">Frequently Asked Questions</h2>
          </div>
          <h1 className="text-3xl font-light text-white/90 tracking-wide">
            Everything you need to know
          </h1>
          <p className="text-white/25 text-sm font-light mt-2">
            Transparency is part of our promise.
          </p>
        </div>

        {/* FAQ List */}
        <div className="relative">
          <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 via-white/5 to-transparent rounded-2xl" />
          <div className="relative bg-black rounded-2xl px-6">
            {faqs.map((faq, i) => (
              <FAQAccordion key={i} item={faq} index={i} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center space-y-4">
          <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent mx-auto" />
          <p className="text-white/15 text-[10px] tracking-[0.3em] uppercase">
            Still have questions?
          </p>
          <a
            href="mailto:contact@sortedtech.co"
            className="inline-block text-white/30 hover:text-white/60 text-xs tracking-wider transition-colors border-b border-white/10 hover:border-white/30 pb-0.5"
          >
            Get in touch
          </a>
        </div>
      </div>
    </div>
  );
}
