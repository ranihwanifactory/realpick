import React, { useState, useRef } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Property, UserProfile } from '../types';

interface PropertyFormProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: { lat: number; lng: number } | null;
  onSelectLocationMode: () => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ user, isOpen, onClose, selectedLocation, onSelectLocationMode }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<Property['type']>('apartment');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) {
      alert('지도에서 위치를 선택해주세요.');
      return;
    }
    if (!title || !price) {
      alert('필수 정보를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = 'https://picsum.photos/400/300'; // Fallback

      if (imageFile) {
        const storageRef = ref(storage, `properties/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'properties'), {
        title,
        description,
        price: Number(price),
        type,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        imageUrl,
        createdAt: Date.now(),
        createdBy: user.email
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setImageFile(null);
      onClose();
      alert('매물이 성공적으로 등록되었습니다.');
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('매물 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg