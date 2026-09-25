import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../../context/AuthContext";
import Avatar from "../components/Avatar";
import { BackIcon, CameraIcon, Spinner } from "../components/Icons";
import { readFileAsDataURL, validateImage } from "../lib/utils";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [name, setName] = useState(authUser.fullName || "");
  const [bio, setBio] = useState(authUser.bio || "");
  const [saving, setSaving] = useState(false);

  const preview = useMemo(() => (selectedImage ? URL.createObjectURL(selectedImage) : null), [selectedImage]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const dirty = selectedImage || name.trim() !== authUser.fullName || bio.trim() !== (authUser.bio || "");

  const onPickImage = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    const error = validateImage(file);
    if (error) return toast.error(error);
    setSelectedImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const body = { fullName: name.trim(), bio: bio.trim() };
      if (selectedImage) body.profilePic = await readFileAsDataURL(selectedImage);
      if (await updateProfile(body)) navigate("/");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="panel w-full max-w-lg rounded-3xl p-6 sm:p-8 animate-pop-in">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/")} className="icon-btn -ml-2" aria-label="Back to chats"><BackIcon /></button>
          <h1 className="text-xl font-semibold">Edit profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <label htmlFor="avatar" className="group relative cursor-pointer rounded-full">
              <Avatar user={{ ...authUser, fullName: name || authUser.fullName }} size="xl" src={preview || undefined} />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
                <CameraIcon className="w-7 h-7 text-white" />
              </span>
              <span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white ring-4 ring-ink-900">
                <CameraIcon className="w-4 h-4" />
              </span>
            </label>
            <input onChange={onPickImage} type="file" id="avatar" accept="image/png, image/jpeg, image/webp" hidden />
            <p className="text-xs text-slate-500">{selectedImage ? selectedImage.name : "Click the photo to change it (max 4MB)"}</p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} type="text" required maxLength={50} placeholder="Your name" className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Email</span>
            <input value={authUser.email} disabled className="field opacity-60 cursor-not-allowed" />
          </label>
          <label className="block">
            <span className="mb-1.5 flex justify-between text-xs font-medium text-slate-400">
              Bio <span className="font-normal text-slate-500">{bio.length}/160</span>
            </span>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} rows={3}
              placeholder="Tell people a little about yourself" className="field resize-none" />
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate("/")} className="btn-ghost flex-1 bg-white/5">Cancel</button>
            <button type="submit" disabled={!dirty || saving} className="btn-primary flex-1">
              {saving && <Spinner className="w-4 h-4" />} Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
