export interface Layer {
  id: string;
  name: string;
  type: 'text' | 'image';
  visible: boolean;
  fabricObject?: fabric.Object;
}

export interface EditableArea {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ProductConfig {
  name: string;
  mockupImage: string;
  editableArea: EditableArea;
}

export interface DesignExport {
  canvasJSON: string;
  timestamp: number;
  productConfig: ProductConfig;
}

export interface TextOptions {
  fontFamily: string;
  fontSize: number;
  fill: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
}
