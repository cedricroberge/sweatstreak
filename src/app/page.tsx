'use client'

import React, { useState, useEffect, useRef } from 'react'
import Webcam from 'react-webcam'
import {
  Camera,
  Home,
  Users,
  LogOut,
  Image as Gallery,
  Heart,
  RefreshCw,
  Menu,
  User,
  ArrowLeft
} from 'lucide-react'
import { Bungee } from 'next/font/google'

const bubbleFont = Bungee({ subsets: ['latin'], weight: '400' })

// ✅ Type definitions
interface Comment {
  user: string
  text: string
}

interface Post {
  id: number
  user: string
  image: string
  caption: string
  date: string
  likes: string[]
  comments: Comment[]
  visibility?: 'public' | 'private'
}

interface Account {
  email: string
  username: string
  password: string
  bio?: string
  profilePic?: string
}

export default function SweatStreakApp() {
  const [page, setPage] = useState<'signup' | 'login' | 'app'>('signup')
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [inputUser, setInputUser] = useState('')
  const [inputPass, setInputPass] = useState('')
  const [inputEmail, setInputEmail] = useState('')
  const [view, setView] = useState<'feed' | 'camera' | 'friends' | 'progress' | 'profile' | 'friendProfile'>('camera')
  const [posts, setPosts] = useState<Post[]>([])
  const [friends, setFriends] = useState<string[]>([])
  const [friendInput, setFriendInput] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [fullscreenCam, setFullscreenCam] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})
  const [notifications, setNotifications] = useState<string[]>([])
  const [pulse, setPulse] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [menuOpen, setMenuOpen] = useState(false)
  const [caption, setCaption] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [profileBio, setProfileBio] = useState('')
  const [profilePic, setProfilePic] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [friendPreview, setFriendPreview] = useState<Account | null>(null)
  const [activeFriend, setActiveFriend] = useState<Account | null>(null)

  const webcamRef = useRef<Webcam | null>(null)
  const todayISO = new Date().toISOString().split('T')[0]

  // ✅ Load session
  useEffect(() => {
    const savedUser = localStorage.getItem('sweatstreak_user')
    if (savedUser) {
      setUsername(savedUser)
      setLoggedIn(true)
      setPage('app')
    }
  }, [])

  // ✅ Load posts and profile
  useEffect(() => {
    if (loggedIn) {
      const allPosts: Post[] = JSON.parse(localStorage.getItem('sweatstreak_posts') || '[]').map((p: any) => ({
        ...p,
        likes: Array.isArray(p.likes) ? p.likes : [],
        comments: Array.isArray(p.comments) ? p.comments : [],
      }))
      const userFriends: string[] = JSON.parse(localStorage.getItem(`friends_${username}`) || '[]')
      setPosts(allPosts)
      setFriends(userFriends)
      const users: Record<string, Account> = JSON.parse(localStorage.getItem('sweatstreak_accounts') || '{}')
      const me = users[username]
      if (me) {
        setProfileBio(me.bio || '')
        setProfilePic(me.profilePic || null)
      }
    }
  }, [loggedIn, username])

  function savePosts(newPosts: Post[]) {
    setPosts(newPosts)
    localStorage.setItem('sweatstreak_posts', JSON.stringify(newPosts))
  }

  // --- AUTH ---
  function isValidPassword(pass: string) {
    return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(pass)
  }

  function handleSignup(): void {
    if (!inputEmail || !inputUser || !inputPass)
      return alert('Please fill in all fields.')
    if (!isValidPassword(inputPass))
      return alert('Password must be at least 8 characters, include a capital letter, and one number.')
    const users: Record<string, Account> = JSON.parse(localStorage.getItem('sweatstreak_accounts') || '{}')
    if (Object.values(users).some(u => u.username === inputUser || u.email === inputEmail))
      return alert('Email or username already taken.')
    users[inputUser] = {
      email: inputEmail,
      username: inputUser,
      password: inputPass,
      bio: '',
      profilePic: ''
    }
    localStorage.setItem('sweatstreak_accounts', JSON.stringify(users))
    localStorage.setItem('sweatstreak_user', inputUser)
    setUsername(inputUser)
    setLoggedIn(true)
    setPage('app')
    alert('✅ Account created and logged in!')
  }

  function handleLogin(): void {
    const users: Record<string, Account> = JSON.parse(localStorage.getItem('sweatstreak_accounts') || '{}')
    const foundUser = Object.values(users).find(
      u => (u.username === inputUser || u.email === inputUser) && u.password === inputPass
    )
    if (foundUser) {
      setUsername(foundUser.username)
      setLoggedIn(true)
      setPage('app')
      localStorage.setItem('sweatstreak_user', foundUser.username)
    } else alert('Invalid email/username or password.')
  }

  function handleLogout(): void {
    localStorage.removeItem('sweatstreak_user')
    setLoggedIn(false)
    setUsername('')
    setPage('login')
  }

  // --- CAMERA ---
  function openCamera(): void {
    setCameraError(null)
    setPreview(null)
    setShowCamera(true)
    setFullscreenCam(true)
  }

  function toggleCamera(): void {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'))
  }

  function capturePhoto(): void {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        setPreview(imageSrc)
        setShowCamera(false)
        setFullscreenCam(false)
      } else {
        setCameraError('Failed to capture photo.')
      }
    }
  }

  function confirmPhoto(): void {
    if (!preview) return
    const hasPostedToday = posts.some(p => p.user === username && p.date === todayISO)
    if (hasPostedToday) {
      alert("You've already posted your daily SweatStreak! 💪")
      setPreview(null)
      setShowCamera(false)
      setView('feed')
      return
    }
    const newPost: Post = {
      id: Date.now(),
      user: username,
      image: preview,
      caption: caption || "Just finished today's workout 💪",
      date: todayISO,
      likes: [],
      comments: [],
      visibility
    }
    const updated = [newPost, ...posts]
    savePosts(updated)
    if (visibility === 'public') {
      friends.forEach(friend => {
        const friendNotifications: string[] = JSON.parse(localStorage.getItem(`notifications_${friend}`) || '[]')
        friendNotifications.push(`${username} just posted their SweatStreak! 🔥`)
        localStorage.setItem(`notifications_${friend}`, JSON.stringify(friendNotifications))
      })
    }
    setPreview(null)
    setCaption('')
    setShowCamera(false)
    setView('feed')
  }
  // --- FRIENDS ---
  function handleAddFriend(): void {
    if (!friendInput.trim()) return alert('Enter a username to add.')
    const users: Record<string, Account> = JSON.parse(localStorage.getItem('sweatstreak_accounts') || '{}')
    if (!users[friendInput]) return alert('That user doesn’t exist.')
    if (friends.includes(friendInput)) return alert('Already added.')
    const newFriends = [...friends, friendInput]
    setFriends(newFriends)
    localStorage.setItem(`friends_${username}`, JSON.stringify(newFriends))
    setFriendInput('')
    alert('✅ Friend added!')
  }

  function previewFriend(): void {
    const users: Record<string, Account> = JSON.parse(localStorage.getItem('sweatstreak_accounts') || '{}')
    const found = users[friendInput]
    if (found) setFriendPreview(found)
    else setFriendPreview(null)
  }

  function openFriendProfile(friend: Account) {
    setActiveFriend(friend)
    setView('friendProfile')
  }

  // --- PROFILE ---
  function saveProfileChanges() {
    const users: Record<string, Account> = JSON.parse(localStorage.getItem('sweatstreak_accounts') || '{}')
    if (users[username]) {
      users[username] = {
        ...users[username],
        bio: profileBio,
        profilePic: profilePic || '',
      }
      localStorage.setItem('sweatstreak_accounts', JSON.stringify(users))
      alert('✅ Profile updated!')
      setEditingProfile(false)
    }
  }

  function handleProfilePicChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setProfilePic(reader.result as string)
    reader.readAsDataURL(file)
  }

  // --- NOTIFICATIONS ---
  useEffect(() => {
    if (loggedIn) {
      const userNotifications: string[] = JSON.parse(localStorage.getItem(`notifications_${username}`) || '[]')
      if (userNotifications.length > 0) {
        setNotifications(userNotifications)
        setPulse(true)
        setTimeout(() => setPulse(false), 3000)
        localStorage.setItem(`notifications_${username}`, JSON.stringify([]))
      }
    }
  }, [posts, loggedIn, username])

  // --- INTERACTIONS ---
  function toggleLike(postId: number): void {
    const updated = posts.map(p =>
      p.id === postId
        ? {
            ...p,
            likes: p.likes.includes(username)
              ? p.likes.filter(u => u !== username)
              : [...p.likes, username],
          }
        : p
    )
    savePosts(updated)
  }

  function addComment(postId: number): void {
    const text = commentInputs[postId]
    if (!text?.trim()) return
    const updated = posts.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, { user: username, text }] } : p
    )
    savePosts(updated)
    setCommentInputs({ ...commentInputs, [postId]: '' })
  }

  // --- LOGIN / SIGNUP ---
  if (!loggedIn && page === 'signup') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#3A47FF] text-white">
        <div className="bg-white p-10 rounded-xl w-full max-w-sm text-center shadow-lg border border-white text-black">
          <h1 className={`${bubbleFont.className} text-4xl mb-6 text-black`}>SweatStreak</h1>
          <input
            placeholder="Email"
            value={inputEmail}
            onChange={e => setInputEmail(e.target.value)}
            className="w-full mb-3 p-2 rounded border border-gray-300"
          />
          <input
            placeholder="Username"
            value={inputUser}
            onChange={e => setInputUser(e.target.value)}
            className="w-full mb-3 p-2 rounded border border-gray-300"
          />
          <input
            type="password"
            placeholder="Password"
            value={inputPass}
            onChange={e => setInputPass(e.target.value)}
            className="w-full mb-4 p-2 rounded border border-gray-300"
          />
          <p className="text-xs text-gray-500 mb-3">
            Password must be at least 8 characters, include 1 capital letter, and 1 number.
          </p>
          <button
            onClick={handleSignup}
            className="w-full bg-black text-white py-2 rounded mb-3 font-bold"
          >
            Sign Up
          </button>
          <button
            onClick={() => setPage('login')}
            className="text-sm text-gray-800 hover:text-black"
          >
            Already have an account? Log in
          </button>
        </div>
      </div>
    )
  }

  if (!loggedIn && page === 'login') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#3A47FF] text-white">
        <div className="bg-white p-10 rounded-xl w-full max-w-sm text-center shadow-lg border border-white text-black">
          <h1 className={`${bubbleFont.className} text-4xl mb-6 text-black`}>SweatStreak</h1>
          <input
            placeholder="Email or Username"
            value={inputUser}
            onChange={e => setInputUser(e.target.value)}
            className="w-full mb-3 p-2 rounded border border-gray-300"
          />
          <input
            type="password"
            placeholder="Password"
            value={inputPass}
            onChange={e => setInputPass(e.target.value)}
            className="w-full mb-4 p-2 rounded border border-gray-300"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-black text-white py-2 rounded mb-3 font-bold"
          >
            Log In
          </button>
          <button
            onClick={() => setPage('signup')}
            className="text-sm text-gray-800 hover:text-black"
          >
            Don’t have an account? Sign up
          </button>
        </div>
      </div>
    )
  }

  // --- MAIN APP ---
  const feedPosts = posts.filter(
    p =>
      (p.user === username || friends.includes(p.user)) &&
      (p.visibility === 'public' || p.user === username)
  )
  return (
    <div className="flex min-h-screen text-white bg-[#3A47FF] relative">
      {/* Hamburger Menu */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white text-black p-2 rounded-md shadow-lg"
      >
        <Menu />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:relative top-0 left-0 h-full w-48 md:w-56 lg:w-60 flex flex-col p-4 border-r border-white shadow-md bg-[#3A47FF] transform ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-40`}
      >
        <h1 className={`${bubbleFont.className} text-xl md:text-2xl mb-4 text-white`}>SweatStreak</h1>
        <p className="text-xs md:text-sm mb-4">@{username}</p>
        <nav className="flex flex-col gap-3 flex-1">
          <button onClick={() => { setView('feed'); setMenuOpen(false) }} className="flex items-center gap-2 p-2 hover:bg-white/20 rounded-md"><Home /> Feed</button>
          <button onClick={() => { setView('camera'); setMenuOpen(false) }} className="flex items-center gap-2 p-2 hover:bg-white/20 rounded-md"><Camera /> Take Photo</button>
          <button onClick={() => { setView('friends'); setMenuOpen(false) }} className="flex items-center gap-2 p-2 hover:bg-white/20 rounded-md"><Users /> Friends</button>
          <button onClick={() => { setView('progress'); setMenuOpen(false) }} className="flex items-center gap-2 p-2 hover:bg-white/20 rounded-md"><Gallery /> My Progress</button>
          <button onClick={() => { setView('profile'); setMenuOpen(false) }} className="flex items-center gap-2 p-2 hover:bg-white/20 rounded-md"><User /> Profile</button>
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-2 text-white hover:text-gray-200 mt-4"><LogOut /> Logout</button>
      </aside>

      {menuOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMenuOpen(false)} />}

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">

        {/* ✅ Fullscreen Camera */}
        {fullscreenCam && (
          <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ width: 1920, height: 1080, facingMode }}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4">
              <button onClick={() => setFullscreenCam(false)} className="bg-white text-black px-3 py-1 rounded">X</button>
            </div>
            <div className="absolute bottom-8 flex gap-4">
              <button onClick={toggleCamera} className="bg-white text-black px-6 py-2 rounded-md font-bold flex items-center gap-2">
                <RefreshCw size={16} /> Flip
              </button>
              <button onClick={capturePhoto} className="bg-red-500 text-white px-8 py-3 rounded-full font-bold text-lg">●</button>
            </div>
          </div>
        )}

        {/* Camera Section */}
        {view === 'camera' && !fullscreenCam && (
          <section className="text-center">
            <h2 className={`${bubbleFont.className} text-3xl mb-4 text-white`}>Take Your Daily Photo</h2>
            {!showCamera && !preview && (
              <button onClick={openCamera} className="bg-white text-black px-8 py-3 rounded-md font-bold hover:bg-gray-200">
                Open Camera
              </button>
            )}
            {cameraError && <p className="text-red-200 mt-4">{cameraError}</p>}
            {preview && (
              <div className="flex flex-col items-center gap-4 mt-6">
                <img src={preview} alt="Preview" className="rounded-lg border-4 border-white w-[320px]" />
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-80 p-2 rounded text-black border border-white"
                />
                <div className="flex items-center gap-3">
                  <label className="text-white font-bold">Visibility:</label>
                  <select
                    value={visibility}
                    onChange={e => setVisibility(e.target.value as 'public' | 'private')}
                    className="text-black rounded p-1 border border-gray-300"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div className="flex gap-3 mt-3">
                  <button onClick={confirmPhoto} className="bg-white text-black px-6 py-2 rounded-md font-bold">Post</button>
                  <button onClick={() => setPreview(null)} className="bg-black text-white px-6 py-2 rounded-md">Retake</button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Feed Section */}
        {view === 'feed' && (
          <section>
            <h2 className={`${bubbleFont.className} text-3xl mb-6 text-white`}>Friends Feed</h2>
            {feedPosts.length === 0 ? (
              <p>No posts yet.</p>
            ) : (
              feedPosts.map(post => (
                <div key={post.id} className="bg-[#3A47FF]/50 p-4 rounded-lg mb-5 border border-white shadow-sm text-left">
                  <img src={post.image} alt={post.caption} className="rounded-lg mb-3 w-full object-cover border border-white" />
                  <div className="flex justify-between items-center mb-2">
                    <button
                      onClick={() => {
                        const users = JSON.parse(localStorage.getItem('sweatstreak_accounts') || '{}')
                        if (users[post.user]) openFriendProfile(users[post.user])
                      }}
                      className="font-semibold text-white underline"
                    >
                      @{post.user}
                    </button>
                    <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1">
                      <Heart fill={post.likes.includes(username) ? 'red' : 'none'} /> {post.likes.length}
                    </button>
                  </div>
                  <p>{post.caption}</p>
                  <p className="text-xs text-gray-200 mb-2">{post.date}</p>
                  <div className="mt-2">
                    {post.comments.map((c, i) => (
                      <p key={i} className="text-sm text-white">
                        <strong>@{c.user}:</strong> {c.text}
                      </p>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Add comment..."
                        value={commentInputs[post.id] || ''}
                        onChange={e => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        className="flex-1 p-1 text-black rounded-md border border-white"
                      />
                      <button onClick={() => addComment(post.id)} className="bg-white text-black px-3 rounded-md font-bold">
                        💬
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* Friends Section */}
        {view === 'friends' && (
          <section>
            <h2 className={`${bubbleFont.className} text-3xl mb-6 text-white`}>Friends</h2>
            <div className="flex gap-3 mb-4">
              <input
                value={friendInput}
                onChange={e => setFriendInput(e.target.value)}
                placeholder="Enter username"
                className="p-2 rounded-md text-black flex-1 border border-white"
              />
              <button onClick={previewFriend} className="bg-white text-black px-4 py-2 rounded-md font-bold">
                Search
              </button>
            </div>
            {friendPreview && (
              <div className="bg-white/10 p-4 rounded-md mb-4">
                {friendPreview.profilePic && (
                  <img src={friendPreview.profilePic} className="w-16 h-16 rounded-full mx-auto mb-2 border border-white" />
                )}
                <p className="text-center font-bold">@{friendPreview.username}</p>
                <div className="flex justify-center gap-3 mt-2">
                  <button onClick={() => openFriendProfile(friendPreview)} className="bg-white text-black px-3 py-1 rounded">
                    View Profile
                  </button>
                  {!friends.includes(friendPreview.username) && (
                    <button onClick={handleAddFriend} className="bg-green-500 text-white px-3 py-1 rounded">
                      Add Friend
                    </button>
                  )}
                </div>
              </div>
            )}
            {friends.length === 0 ? (
              <p>You haven’t added any friends yet.</p>
            ) : (
              <ul className="space-y-2">
                {friends.map(f => (
                  <li
                    key={f}
                    className="bg-[#3A47FF]/50 p-3 rounded-md border border-white shadow-sm cursor-pointer"
                    onClick={() => {
                      const users = JSON.parse(localStorage.getItem('sweatstreak_accounts') || '{}')
                      if (users[f]) openFriendProfile(users[f])
                    }}
                  >
                    @{f}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* My Progress */}
        {view === 'progress' && (
          <section>
            <h2 className={`${bubbleFont.className} text-3xl mb-6 text-white`}>My Progress</h2>
            {posts.filter(p => p.user === username).length === 0 ? (
              <p>No photos yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {posts
                  .filter(p => p.user === username)
                  .map(p => (
                    <div key={p.id} className="bg-[#3A47FF]/50 p-2 rounded-lg border border-white text-center shadow-sm">
                      <img src={p.image} alt={p.caption} className="rounded-lg mb-2 border border-white" />
                      <p className="text-xs text-gray-100">{p.date}</p>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {/* Profile Section */}
        {view === 'profile' && (
          <section>
            <h2 className={`${bubbleFont.className} text-3xl mb-6 text-white`}>My Profile</h2>
            {!editingProfile ? (
              <div className="text-center">
                {profilePic && <img src={profilePic} alt="Profile" className="w-24 h-24 rounded-full mx-auto mb-3 border-2 border-white" />}
                <p className="text-lg font-bold">@{username}</p>
                <p className="text-sm italic text-gray-200 mb-4">{profileBio || 'No bio yet.'}</p>
                <button onClick={() => setEditingProfile(true)} className="bg-white text-black px-4 py-2 rounded-md font-bold">Edit Profile</button>
              </div>
            ) : (
              <div className="max-w-md mx-auto bg-white/10 p-4 rounded-md">
                <label className="block mb-2 font-bold">Bio:</label>
                <textarea value={profileBio} onChange={e => setProfileBio(e.target.value)} className="w-full p-2 rounded text-black mb-3" />
                <label className="block mb-2 font-bold">Profile Picture:</label>
                <input type="file" accept="image/*" onChange={handleProfilePicChange} className="mb-3" />
                <div className="flex justify-center gap-3">
                  <button onClick={saveProfileChanges} className="bg-white text-black px-4 py-2 rounded-md font-bold">Save</button>
                  <button onClick={() => setEditingProfile(false)} className="bg-black text-white px-4 py-2 rounded-md">Cancel</button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Friend Profile Page */}
        {view === 'friendProfile' && activeFriend && (
          <section>
            <button onClick={() => setView('friends')} className="flex items-center gap-2 mb-4"><ArrowLeft /> Back</button>
            <div className="text-center mb-6">
              {activeFriend.profilePic && <img src={activeFriend.profilePic} className="w-24 h-24 rounded-full mx-auto mb-3 border border-white" />}
              <p className="font-bold text-xl">@{activeFriend.username}</p>
              <p className="text-sm italic text-gray-200">{activeFriend.bio || 'No bio yet.'}</p>
              {!friends.includes(activeFriend.username) && (
                <button
                  onClick={() => {
                    setFriendInput(activeFriend.username)
                    handleAddFriend()
                  }}
                  className="mt-3 bg-white text-black px-4 py-2 rounded-md"
                >
                  Add Friend
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {posts
                .filter(p => p.user === activeFriend.username && p.visibility !== 'private')
                .map(p => (
                  <div key={p.id} className="bg-[#3A47FF]/50 p-2 rounded-lg border border-white text-center">
                    <img src={p.image} alt={p.caption} className="rounded-lg mb-2 border border-white" />
                    <p className="text-xs text-gray-100">{p.caption}</p>
                  </div>
                ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
