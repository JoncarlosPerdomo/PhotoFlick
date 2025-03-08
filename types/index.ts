import { Asset } from "expo-media-library";

export interface DateGroup {
  date: string;
  count: number;
  photos: Asset[];
}

export interface PhotoContextType {
  deletePile: Asset[];
  addToDeletePile: (photo: Asset) => void;
  removeFromDeletePile: (photoId: string) => void;
  clearDeletePile: () => void;
  saveDeletePile: () => Promise<void>;
  loadDeletePile: () => Promise<void>;
}
