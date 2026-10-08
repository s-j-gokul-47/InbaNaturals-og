import hairOilImg from '../assets/products/hair-oil.jpg';
import hairPackImg from '../assets/products/hair-pack.jpg';
import facePackImg from '../assets/products/face-pack.jpg';
import faceSerumImg from '../assets/products/face-serum.jpg';

// Shared product data used across pages
export interface Product {
  id: string;
  name: string;
  tagline: string;
  price: string;
  originalPrice?: string;
  category: 'hair' | 'face';
  image: string;
  sizes: string[];
  description: string;
  howToUse: string;
  ingredients: string;
}

export const products: Product[] = [
  {
    id: 'hair-oil',
    name: 'Hair Oil',
    tagline: 'Nourishing botanical blend for lustrous locks',
    price: '₹499',
    originalPrice: '₹699',
    category: 'hair',
    image: hairOilImg,
    sizes: ['50ml', '100ml', '200ml'],
    description:
      'Awaken your roots with our deeply nourishing botanical blend. Crafted from nature\'s most resilient extracts, this lightweight oil penetrates the scalp to lock in moisture and promote healthy, lustrous growth. Experience the soothing ritual of traditional hair care redefined for the modern age.',
    howToUse:
      'Apply 5–6 drops to your scalp and massage gently in circular motions. Leave on for at least 30 minutes or overnight for best results. Wash off with a mild shampoo. Use 2–3 times a week for optimal results.',
    ingredients:
      'Cocos Nucifera (Coconut) Oil, Argania Spinosa (Argan) Kernel Oil, Ricinus Communis (Castor) Seed Oil, Rosmarinus Officinalis (Rosemary) Leaf Extract, Vitamin E Tocopherol, Lavandula Angustifolia (Lavender) Essential Oil.',
  },
  {
    id: 'hair-pack',
    name: 'Hair Pack',
    tagline: 'Deep conditioning mask for silky smooth hair',
    price: '₹399',
    originalPrice: '₹549',
    category: 'hair',
    image: hairPackImg,
    sizes: ['100g', '200g'],
    description:
      'Transform dull, lifeless strands into a crown of silk with this luxurious deep conditioning treatment. Infused with mineral-rich clays and restorative botanical oils, it works intensely to smooth frizz and deliver brilliant, lasting shine. Treat yourself to a spa-like revival in the comfort of your own home.',
    howToUse:
      'Apply generously to damp hair from roots to tips. Leave on for 20–30 minutes. Rinse thoroughly with lukewarm water. For best results, use once a week after shampooing.',
    ingredients:
      'Aqua, Kaolin Clay, Butyrospermum Parkii (Shea) Butter, Aloe Barbadensis Leaf Juice, Hydrolyzed Keratin, Panthenol (Pro-Vitamin B5), Citric Acid, Phenoxyethanol.',
  },
  {
    id: 'face-pack',
    name: 'Face Pack',
    tagline: 'Brightening clay mask for radiant, clear skin',
    price: '₹349',
    originalPrice: '₹499',
    category: 'face',
    image: facePackImg,
    sizes: ['50g', '100g'],
    description:
      'Unveil your skin\'s true radiance with our purifying, earth-derived clay mask. Harmonizing the gentle detoxifying power of natural clays with the brightening magic of turmeric and vitamin C, it effortlessly draws out impurities. The result is a beautifully clear, luminous complexion that feels incredibly soft to the touch.',
    howToUse:
      'Mix 1–2 teaspoons with rose water or plain water to form a smooth paste. Apply evenly to cleansed face. Leave for 15–20 minutes until partially dry. Rinse off with lukewarm water.',
    ingredients:
      'Kaolin Clay, Multani Mitti (Fuller\'s Earth), Curcuma Longa (Turmeric) Root Powder, Santalum Album (Sandalwood) Powder, Rosa Damascena (Rose) Petal Powder, Citrus Sinensis (Orange Peel) Powder.',
  },
  {
    id: 'face-serum',
    name: 'Face Serum',
    tagline: 'Hydrating vitamin-C serum for youthful glow',
    price: '₹599',
    originalPrice: '₹799',
    category: 'face',
    image: faceSerumImg,
    sizes: ['15ml', '30ml'],
    description:
      'Drench your skin in pure, weightless hydration with our age-defying vitamin C serum. This potent elixir combines botanical extracts and hyaluronic acid to instantly firm, brighten, and restore your natural bounce. Elevate your daily routine with a drop of liquid gold for a youthful, dewy glow.',
    howToUse:
      'After cleansing and toning, apply 3–4 drops to your face and neck. Gently press into skin using fingertips. Follow with your moisturizer. Use morning and evening for best results.',
    ingredients:
      'Aqua, Ascorbic Acid (Vitamin C), Sodium Hyaluronate, Niacinamide, Glycerin, Centella Asiatica Extract, Rosa Canina (Rosehip) Seed Oil, Allantoin, Citric Acid.',
  },
];
