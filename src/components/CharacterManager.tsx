import { useState, useEffect, useRef } from 'react';
import { X, Plus, User, Camera, Trash2, Edit2, Check } from 'lucide-react';
import * as characterDB from '../utils/characterDB';
import type { Character } from '../utils/characterDB';

interface CharacterManagerProps {
  onClose: () => void;
  onSelectCharacter?: (character: Character) => void;
  selectionMode?: boolean; // 是否是选择模式（拍照时选角色）
}

export function CharacterManager({ onClose, onSelectCharacter, selectionMode = false }: CharacterManagerProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // 创建表单状态
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const data = await characterDB.getAllCharacters();
      setCharacters(data);
    } catch (error) {
      console.error('加载角色失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newImage) {
      alert('请输入角色名字并上传照片');
      return;
    }

    try {
      await characterDB.createCharacter({
        name: newName.trim(),
        description: newDescription.trim(),
        referenceImage: newImage,
        createdAt: Date.now(),
        usageCount: 0,
      });

      // 重置表单
      setNewName('');
      setNewDescription('');
      setNewImage(null);
      setShowCreateForm(false);

      // 重新加载列表
      await loadCharacters();
    } catch (error) {
      console.error('创建角色失败:', error);
      alert('创建失败，请重试');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个角色吗？')) return;

    try {
      await characterDB.deleteCharacter(id);
      await loadCharacters();
    } catch (error) {
      console.error('删除角色失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleSelect = (character: Character) => {
    if (selectionMode && onSelectCharacter) {
      onSelectCharacter(character);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <h2 className="text-white">
          {selectionMode ? '选择角色' : '角色管理'}
        </h2>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60">加载中...</div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Create Button */}
            {!selectionMode && !showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full bg-[#FFFC00] text-black py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#FFFC00]/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>创建新角色</span>
              </button>
            )}

            {/* Create Form */}
            {showCreateForm && (
              <div className="bg-white/5 rounded-lg p-4 space-y-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-white">创建新角色</h3>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewName('');
                      setNewDescription('');
                      setNewImage(null);
                    }}
                    className="text-white/60 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-white/80 mb-2 text-sm">参考照片</label>
                  <div className="relative">
                    {newImage ? (
                      <div className="relative aspect-square rounded-lg overflow-hidden">
                        <img
                          src={newImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setNewImage(null)}
                          className="absolute top-2 right-2 bg-black/60 p-2 rounded-full text-white hover:bg-black/80"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-square border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[#FFFC00] hover:bg-white/5 transition-colors"
                      >
                        <Camera className="w-8 h-8 text-white/40" />
                        <span className="text-white/60 text-sm">点击上传照片</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-white/80 mb-2 text-sm">角色名字</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="例如：小明、爱丽丝"
                    className="w-full bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20 focus:border-[#FFFC00] focus:outline-none"
                    maxLength={20}
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-white/80 mb-2 text-sm">描述（可选）</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="例如：我的朋友"
                    className="w-full bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20 focus:border-[#FFFC00] focus:outline-none"
                    maxLength={50}
                  />
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || !newImage}
                  className="w-full bg-[#FFFC00] text-black py-3 rounded-lg hover:bg-[#FFFC00]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  <span>创建角色</span>
                </button>
              </div>
            )}

            {/* Characters Grid */}
            {characters.length === 0 ? (
              <div className="text-center py-16 text-white/40">
                <User className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>还没有创建角色</p>
                <p className="text-sm mt-2">创建角色后，可以让 TA 出现在照片中</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {characters.map((character) => (
                  <div
                    key={character.id}
                    onClick={() => handleSelect(character)}
                    className={`bg-white/5 rounded-lg overflow-hidden border border-white/10 ${
                      selectionMode ? 'cursor-pointer hover:border-[#FFFC00] hover:bg-white/10' : ''
                    } transition-colors`}
                  >
                    {/* Image */}
                    <div className="aspect-square relative">
                      <img
                        src={character.referenceImage}
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                      {!selectionMode && (
                        <button
                          onClick={() => handleDelete(character.id!)}
                          className="absolute top-2 right-2 bg-black/60 p-2 rounded-full text-white hover:bg-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-white truncate">{character.name}</h3>
                      {character.description && (
                        <p className="text-white/60 text-sm truncate mt-1">
                          {character.description}
                        </p>
                      )}
                      <p className="text-white/40 text-xs mt-2">
                        使用 {character.usageCount} 次
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selection Mode Hint */}
      {selectionMode && characters.length > 0 && (
        <div className="px-4 py-3 bg-white/5 border-t border-white/10">
          <p className="text-white/60 text-sm text-center">
            点击选择一个角色，或关闭不使用角色
          </p>
        </div>
      )}
    </div>
  );
}
