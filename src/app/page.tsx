'use client';

import DesignEditorWrapper from '@/components/DesignEditorWrapper';
import { ProductConfig } from '@/types/types';

const productConfig: ProductConfig = {
  name: 'T-Shirt',
  mockupImage: '/white-tshirt.png',
  editableArea: {
    left: 200,
    top: 200,
    width: 200,
    height: 250,
  },
  templateCategory: 'tshirt',
};

// const productConfig: ProductConfig = {
//   name: 'T-Shirt',
//   mockupImage: '/tshirt_mockup.png',
//   editableArea: {
//     left: 250,
//     top: 280,
//     width: 300,
//     height: 350,
//   },
// };

// const productConfig: ProductConfig = {
//   name: 'T-Shirt',
//   mockupImage: '/red-tshirt-mock.webp',
//   editableArea: {
//     left: 200,
//     top: 200,
//     width: 200,
//     height: 250,
//   },
// };


export default function Home() {
  const handleSecondaryAction = () => {
    // Example: Save/Order callback
    console.log('Secondary action triggered - save or order');
    alert('Save/Order action would be handled here - e.g., save to database or proceed to checkout');
  };

  return (
    <DesignEditorWrapper
      productConfig={productConfig}
      onSecondaryAction={handleSecondaryAction}
      secondaryButtonText="Save for Later"
    />
  );
}
