// What Abhishek sells, with prices and terms. Read by the /services, /meerut and /about pages,
// the pre-rendered HTML for crawlers (seo/site.ts) and the chat assistant. Edit freely.

import { PROFILE_DATA } from './portfolio';

export interface Package {
  id: string;
  name: string;
  /** Price in INR, one-time */
  price: number;
  pitch: string;
  includes: string[];
  delivery: string;
  highlight?: boolean;
}

export interface Service {
  id: string;
  title: string;
  /** "From ₹8,999" or "Quoted to scope" */
  price: string;
  summary: string;
  includes: string[];
  /** Real projects that prove this service, by Project.id */
  proof: number[];
}

export interface Testimonial {
  quote: string;
  name: string;
  /** Role and company, e.g. "Founder, DelWell" */
  role: string;
  /** Optional link to the project page it's about */
  projectId?: number;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
export const formatInr = inr;

// ─── Website packages (fixed price) ───
export const PACKAGES: Package[] = [
  {
    id: 'basic',
    name: 'Basic website',
    price: 8999,
    pitch: 'A clean, fast site for a shop, clinic, coaching centre or professional.',
    includes: [
      'Up to 4 pages, built for phones first',
      'Domain, hosting and SSL for the first year',
      'WhatsApp button and enquiry form',
      'Google Maps location and basic search setup (titles and descriptions)',
      '2 rounds of design changes',
      '30 days of support after launch',
      'You own the site once it is fully paid',
    ],
    delivery: 'About 3 working days',
  },
  {
    id: 'standard',
    name: 'Standard website',
    price: 12999,
    pitch: 'More room to explain your services and turn visitors into enquiries.',
    includes: [
      'Up to 6 pages, built for phones first',
      'Domain, hosting and SSL for the first year',
      'Business email for the first year',
      'Custom layouts for your key service pages, with clear calls to action',
      'WhatsApp button, enquiry form and Google Maps',
      'Basic search setup (titles and descriptions)',
      '3 rounds of design changes',
      '30 days of support after launch',
      'You own the site once it is fully paid',
    ],
    delivery: 'About 3 working days',
    highlight: true,
  },
];

export const PACKAGE_TERMS = [
  'The delivery clock starts once content, images, approvals and the first payment are in.',
  'Payment: 50% to start, 50% before handover.',
  'Domain, hosting and email renew at normal yearly rates after the first year.',
  'Extra pages or features are quoted separately, before any work starts.',
];

// ─── Services (quoted to scope) ───
export const SERVICES: Service[] = [
  {
    id: 'websites',
    title: 'Business websites',
    price: `From ${inr(8999)}`,
    summary: 'Fast, mobile-first websites for local businesses and professionals, with enquiries going straight to WhatsApp or email.',
    includes: ['Fixed-price packages', 'Domain, hosting and SSL sorted', 'Google Maps and basic search setup'],
    proof: [21, 20, 23, 17],
  },
  {
    id: 'laravel-apps',
    title: 'Laravel web applications',
    price: 'Quoted to scope',
    summary: 'Custom web apps with logins, roles, dashboards and workflows: portals, booking systems, marketplaces and internal tools.',
    includes: ['Laravel with MySQL or PostgreSQL', 'Roles, permissions and audit trails', 'Admin panel and reports'],
    proof: [4, 7, 14],
  },
  {
    id: 'erp-crm',
    title: 'ERP, CRM and admin panels',
    price: 'Quoted to scope',
    summary: 'Billing, inventory, HR, student and case management systems built around how your team actually works.',
    includes: ['Approvals and multi-step workflows', 'GST invoicing, exports and reports', 'Data migration from Excel or an old system'],
    proof: [5, 15, 1],
  },
  {
    id: 'ai-chatbots',
    title: 'AI chatbots and assistants',
    price: 'Quoted to scope',
    summary: 'Assistants that answer from your own documents with sources, plus speech-to-text, OCR and summarising tools, with a person checking the output.',
    includes: ['Answers cite your documents (RAG)', 'Hindi, English and Hinglish', 'Web, WhatsApp-style chat or Android'],
    proof: [13, 3, 2],
  },
  {
    id: 'apis-integrations',
    title: 'APIs and integrations',
    price: 'Quoted to scope',
    summary: 'REST APIs and connections between the tools you already use: payments, WhatsApp and Telegram, Google, CRMs and spreadsheets.',
    includes: ['Documented REST APIs', 'Payment gateways and webhooks', 'Automations with n8n or custom code'],
    proof: [12, 19, 16],
  },
  {
    id: 'android-apps',
    title: 'Android apps',
    price: 'Quoted to scope',
    summary: 'Flutter apps that share the same backend and logins as your website, with camera upload, notifications and offline-friendly screens.',
    includes: ['Flutter, one codebase', 'Uses your existing API and accounts', 'Release builds and update notices'],
    proof: [13],
  },
  {
    id: 'landing-pages',
    title: 'Landing pages',
    price: 'Quoted to scope',
    summary: 'One focused page for an ad campaign, launch or event, built to load fast and collect leads.',
    includes: ['Lead form or WhatsApp capture', 'Fast on mobile data', 'Ready for Google and Meta ads'],
    proof: [17],
  },
  {
    id: 'redesign-care',
    title: 'Redesigns and website care',
    price: 'Quoted to scope',
    summary: 'A fresh, faster version of an existing site, or ongoing updates, fixes, backups and security once it is live.',
    includes: ['Speed and mobile fixes', 'Content and feature updates', 'Backups, renewals and monitoring'],
    proof: [22, 6, 9],
  },
];

// ─── How a project runs ───
export const PROCESS = [
  { title: 'Tell me what you need', text: 'A WhatsApp message, email or a meeting in Meerut. Share what the site or app should do, examples you like and your timeline.' },
  { title: 'Proposal and quote', text: 'You get a clear scope, price and timeline in writing. Work starts with 50% of the payment.' },
  { title: 'Build and review', text: 'You see progress as it is built and get rounds of changes, so there are no surprises at the end.' },
  { title: 'Launch and handover', text: 'The remaining 50% before handover. The site goes live, you get the logins and own the work, and support continues for 30 days.' },
];

// ─── FAQ ───
export const FAQ = [
  { q: 'How long does a website take?', a: 'Packages take about 3 working days once your content, images, approvals and first payment are in. Custom apps get a timeline in the quote, usually 2 to 8 weeks depending on size.' },
  { q: 'What do you need from me to start?', a: 'Your logo, the text for each page (or notes I can turn into text), photos, contact details and a few websites you like. If you don’t have content ready, I can help write it.' },
  { q: 'Do I own the website?', a: 'Yes. Once the final payment is made, the site, its code and the domain are yours.' },
  { q: 'What happens after the first year?', a: 'Domain, hosting and email renew at normal yearly rates. I can manage renewals for you, or hand everything over so you renew directly.' },
  { q: 'Can we meet in person?', a: 'Yes. I’m based in Meerut and meet clients in person in and around the city. For Delhi NCR and the rest of India, we work over calls and WhatsApp.' },
  { q: 'How are custom apps and AI tools priced?', a: 'By scope. After a short call I send a fixed quote for the agreed features, so the price doesn’t change unless the scope does.' },
  { q: 'Do you work with clients outside India?', a: 'Yes, remotely, with invoices in USD and overlap with your working hours for calls.' },
];

// Real client words only. Add an entry once someone agrees to be quoted with their name;
// the section stays hidden on the site while this list is empty.
export const TESTIMONIALS: Testimonial[] = [];

// ─── Meerut ───
export const MEERUT = {
  areas: ['Meerut city', 'Modipuram', 'Partapur', 'Hapur', 'Baghpat', 'Muzaffarnagar', 'Ghaziabad', 'Noida and Delhi NCR (by appointment)'],
  inPerson: 'I meet clients in person in Meerut and nearby towns to understand the work, show progress and hand over the finished site.',
};

// ─── Contact links ───
const phoneDigits = (PROFILE_DATA.phone ?? '').replace(/\D/g, '');

/** WhatsApp chat link with a starter message, or null if no phone number is set. */
export const whatsappHref = (text = 'Hi Abhishek, I found your website and want to discuss a project.') =>
  phoneDigits ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}` : null;
