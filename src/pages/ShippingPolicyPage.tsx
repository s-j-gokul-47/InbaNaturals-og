import LeafDivider from '../components/LeafDivider';

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-ivory/30">
      <div className="bg-ivory-dark py-14 text-center border-b border-ivory-dark">
        <h1 className="font-serif text-5xl text-charcoal mb-3">Shipping Policy</h1>
        <LeafDivider />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl p-8 border border-ivory-dark shadow-sm space-y-4">
          <p className="text-charcoal-light text-sm leading-relaxed">
            We currently process and dispatch orders within 1–2 business days of order
            confirmation via WhatsApp. Orders are shipped through reputed courier
            partners across India. Estimated delivery time is 4–7 business days for
            metro cities and 6–10 business days for other locations, depending on
            serviceability. Shipping charges, if any, will be communicated at the time
            of order confirmation. You will receive a tracking update once your order is
            dispatched. In case of any delay beyond the estimated window, please reach
            out to us on WhatsApp or email and we'll look into it right away. We are not
            liable for delays caused by courier partners, weather, or other
            circumstances beyond our control. Currently we ship only within India; for
            international orders, please contact us directly to check feasibility.
          </p>
        </div>
      </div>
    </div>
  );
}
