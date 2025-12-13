import DesignEditorWrapper from '@/components/DesignEditorWrapper';
import { ProductConfig } from '@/types/types';

const productConfig: ProductConfig = {
  name: 'T-Shirt',
  mockupImage: '/tshirt_mockup.png',
  editableArea: {
    left: 250,
    top: 300,
    width: 300,
    height: 400,
  },
};

export default function Home() {
  return <DesignEditorWrapper productConfig={productConfig} />;
}
