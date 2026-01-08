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
  return <DesignEditorWrapper productConfig={productConfig} />;
}
