import React, { createContext, useState, useContext, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Asset } from "expo-media-library";
import { PhotoContextType } from "../types";

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export const usePhotoContext = (): PhotoContextType => {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error("usePhotoContext must be used within a PhotoProvider");
  }
  return context;
};

interface PhotoProviderProps {
  children: ReactNode;
}

export const PhotoProvider: React.FC<PhotoProviderProps> = ({ children }) => {
  const [deletePile, setDeletePile] = useState<Asset[]>([]);

  const addToDeletePile = (photo: Asset) => {
    setDeletePile((prev) => [...prev, photo]);
  };

  const removeFromDeletePile = (photoId: string) => {
    setDeletePile((prev) => prev.filter((photo) => photo.id !== photoId));
  };

  const clearDeletePile = () => {
    setDeletePile([]);
  };

  // Save the delete pile to AsyncStorage to persist between app sessions
  const saveDeletePile = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem("deletePile", JSON.stringify(deletePile));
    } catch (e) {
      console.error("Failed to save delete pile", e);
    }
  };

  // Load the delete pile from AsyncStorage
  const loadDeletePile = async (): Promise<void> => {
    try {
      const storedPile = await AsyncStorage.getItem("deletePile");
      if (storedPile !== null) {
        setDeletePile(JSON.parse(storedPile));
      }
    } catch (e) {
      console.error("Failed to load delete pile", e);
    }
  };

  const value: PhotoContextType = {
    deletePile,
    addToDeletePile,
    removeFromDeletePile,
    clearDeletePile,
    saveDeletePile,
    loadDeletePile,
  };

  return (
    <PhotoContext.Provider value={value}>{children}</PhotoContext.Provider>
  );
};
