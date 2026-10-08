import LeafDivider from '../components/LeafDivider';

export default function ReturnsPolicyPage() {
  return (
    <div className="min-h-screen bg-ivory/30">
      <div className="bg-ivory-dark py-14 text-center border-b border-ivory-dark">
        <h1 className="font-serif text-5xl text-charcoal mb-3">Returns & Refunds</h1>
        <LeafDivider />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl p-8 border border-ivory-dark shadow-sm space-y-4">
          <p className="text-charcoal-light text-sm leading-relaxed">
            Because our products are natural cosmetics/skincare items, we do not accept
            returns or exchanges once a product has been opened or used, for hygiene and
            safety reasons. If you receive a damaged, defective, or incorrect product,
            please contact us within 48 hours of delivery with your order details and
            photos/video of the issue, and we will arrange a replacement or refund at no
            extra cost. Refunds, once approved, are processed to the original payment
            method within 5–7 business days. We do not offer refunds for change of mind
            once an order has been dispatched. If a delivery attempt fails or a package
            is returned to us as undeliverable due to an incorrect address provided by
            the customer, re-shipping charges may apply.
          </p>
        </div>
      </div>
    </div>
  );
}
