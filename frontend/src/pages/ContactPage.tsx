import { useState, type FormEvent } from 'react';
import { Phone, Mail, MessageCircle, Clock, MapPin, Send, Loader2 } from 'lucide-react';
import LeafDivider from '../components/LeafDivider';
import { WHATSAPP_NUMBER } from '../config';
import { contactApi, getApiErrorMessage } from '../api/client';

export default function ContactPage() {
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formState.name.trim() || !formState.email.trim() || !formState.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First attempt submission via FastAPI contact endpoint
      await contactApi.submit(formState);
      setSubmitted(true);
    } catch (backendErr) {
      console.warn('Backend contact API unavailable, attempting Web3Forms fallback...', backendErr);
      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            access_key: '27812200-cf31-43a4-8dd4-ed7e2ad2e73f',
            ...formState,
          }),
        });
        const result = await response.json();
        if (response.status === 200 && result.success) {
          setSubmitted(true);
        } else {
          setError(result.message || getApiErrorMessage(backendErr, 'Failed to send message. Please try again.'));
        }
      } catch (fallbackErr) {
        console.error('Contact submission error:', fallbackErr);
        setError('Failed to send message. Please reach us directly on WhatsApp or email.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="bg-ivory-dark py-14 text-center border-b border-ivory-dark">
        <span className="text-sage text-xs font-medium uppercase tracking-widest">We're Here For You</span>
        <h1 className="font-serif text-5xl text-charcoal mt-2 mb-3">Get in Touch</h1>
        <LeafDivider />
        <p className="text-charcoal-light mt-4 max-w-md mx-auto text-sm leading-relaxed">
          Have a question about our botanical products or your order? We'd love to hear from you. We typically respond within 24 hours.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-3 gap-10">
        {/* Contact info card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-ivory-dark p-7">
            <h2 className="font-serif text-2xl text-charcoal mb-6">Contact Info</h2>
            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-sage" />
                </div>
                <div>
                  <p className="text-xs text-charcoal-light font-medium uppercase tracking-wider mb-0.5">Phone</p>
                  <a href="tel:+918610866523" className="text-charcoal text-sm font-medium hover:text-sage transition-colors">
                    +91 86108 66523
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-sage" />
                </div>
                <div>
                  <p className="text-xs text-charcoal-light font-medium uppercase tracking-wider mb-0.5">Email</p>
                  <a href="mailto:hello@inbanaturals.com" className="text-charcoal text-sm font-medium hover:text-sage transition-colors">
                    hello@inbanaturals.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
                  <Clock size={18} className="text-sage" />
                </div>
                <div>
                  <p className="text-xs text-charcoal-light font-medium uppercase tracking-wider mb-0.5">Business Hours</p>
                  <p className="text-charcoal text-sm font-medium">Mon–Sat, 10am–6pm IST</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-sage" />
                </div>
                <div>
                  <p className="text-xs text-charcoal-light font-medium uppercase tracking-wider mb-0.5">Location</p>
                  <p className="text-charcoal text-sm font-medium">Coimbatore & Bangalore, India</p>
                </div>
              </li>
            </ul>
          </div>

          {/* WhatsApp card */}
          <div
            className="rounded-2xl p-6 text-white"
            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
          >
            <MessageCircle size={28} className="mb-3" />
            <h3 className="font-serif text-xl font-semibold mb-2">Chat on WhatsApp</h3>
            <p className="text-white/80 text-sm mb-4 leading-relaxed">
              Get instant replies! Message us directly on WhatsApp for orders, recommendations, and fast customer support.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-green-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors"
            >
              <MessageCircle size={16} /> Start Chat
            </a>
          </div>
        </div>

        {/* Contact form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-ivory-dark p-8">
            <h2 className="font-serif text-2xl text-charcoal mb-2">Send us a Message</h2>
            <p className="text-charcoal-light text-sm mb-7">
              Fill in the form below and our team will get back to you as soon as possible.
            </p>

            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={28} className="text-sage" />
                </div>
                <h3 className="font-serif text-2xl text-charcoal mb-2">Message Sent! 🌿</h3>
                <p className="text-charcoal-light text-sm">
                  Thank you for reaching out to InbaNaturals. We've received your inquiry and will reply within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormState({ name: '', email: '', subject: '', message: '' });
                  }}
                  className="mt-6 text-sage text-sm font-medium hover:underline cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">
                    {error}
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-charcoal mb-1.5">
                      Full Name <span className="text-terracotta">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 rounded-xl border border-ivory-dark bg-ivory text-charcoal text-sm placeholder-charcoal-light focus:outline-none focus:border-sage transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-charcoal mb-1.5">
                      Email Address <span className="text-terracotta">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-ivory-dark bg-ivory text-charcoal text-sm placeholder-charcoal-light focus:outline-none focus:border-sage transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-medium text-charcoal mb-1.5">
                    Subject
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={formState.subject}
                    onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                    placeholder="e.g. Order inquiry, Product recommendations…"
                    className="w-full px-4 py-3 rounded-xl border border-ivory-dark bg-ivory text-charcoal text-sm placeholder-charcoal-light focus:outline-none focus:border-sage transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-charcoal mb-1.5">
                    Message <span className="text-terracotta">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={6}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    placeholder="Tell us how we can help you…"
                    className="w-full px-4 py-3 rounded-xl border border-ivory-dark bg-ivory text-charcoal text-sm placeholder-charcoal-light focus:outline-none focus:border-sage transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-sage hover:bg-sage-dark text-white font-semibold py-4 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending Message…
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
