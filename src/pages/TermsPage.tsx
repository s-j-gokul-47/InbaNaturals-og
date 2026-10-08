import LeafDivider from '../components/LeafDivider';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ivory/30">
      <div className="bg-ivory-dark py-14 text-center border-b border-ivory-dark">
        <h1 className="font-serif text-5xl text-charcoal mb-3">Terms of Service</h1>
        <LeafDivider />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl p-8 border border-ivory-dark shadow-sm space-y-4">
          <p className="text-charcoal-light text-sm leading-relaxed">
            By using this website and placing an order with InbaNaturals, you agree to
            the following terms. All product descriptions, images, and pricing are
            provided for informational purposes and may be updated without prior notice.
            Orders placed via WhatsApp or our contact form are confirmed only once
            payment and order details are verified by us. We reserve the right to
            refuse or cancel any order at our discretion, including in cases of
            suspected fraud, pricing errors, or stock unavailability — in such cases,
            any payment already made will be refunded in full. Our products are intended
            for external cosmetic use only; please perform a patch test before first
            use and discontinue use if irritation occurs. We are not liable for allergic
            reactions resulting from undisclosed sensitivities to natural ingredients —
            full ingredient lists are provided on each product page. All content on this
            website, including text, images, and branding, is the property of
            InbaNaturals and may not be reproduced without permission. These terms may
            be updated from time to time; continued use of the site after changes
            constitutes acceptance of the updated terms. For any disputes, the courts of
            Coimbatore, India shall have exclusive jurisdiction.
          </p>
        </div>
      </div>
    </div>
  );
}
