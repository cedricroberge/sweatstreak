'use client'

import React, { useState, useEffect, useRef } from 'react'
import Webcam from 'react-webcam'
import { Camera, Home, Users, LogOut, Image as Gallery, Heart, Bell } from 'lucide-react'

// ✅ Import the bubble font correctly
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
}

export default function SweatStreakApp(): JSX.Element {
  const [page, setPage] = useState<'signup' | 'login' | 'app'>('signup')
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [inputUser, setInputUser] = useState('')
  const [inputPass, setInputPass] = useState('')
  const [view, setView] = useState<'feed' | 'camera' | 'friends' | 'progress'>('camera')
  const [posts, setPosts] = useState<Post[]>([])
  const [friends, setFriends] = useState<string[]>([])
  const [friendInput, setFriendInput] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})
  const [notifications, setNotifications] = useState<string[]>([])
  const [pulse, setPulse] = useState(false)

  const webcamRef = useRef<Webcam | null>(null)
  const todayISO = new Date().toISOString().split('T')[0]

  // ✅ Load user session
  useEffect(() => {
    const savedUser = localStorage.getItem('sweatstreak_user')
    if (savedUser) {
      setUsername(savedUser)
      setLoggedIn(true)
      setPage('app')
    }
  }, [])

  // ✅ Load posts and friends when logged in
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
    }
  }, [loggedIn, username])

  function savePosts(newPosts: Post[]) {
    setPosts(newPosts)
    localStorage.setItem('sweatstreak_posts', JSON.stringify(newPosts))
  }

  // --- AUTH ---
  function handleSignup(): void {
    if (!inputUser || !inputPass) return alert('Please fill in both fields.')
    const users: Record<string, string> = JSON.parse(localStorage.getItem('sweatstreak_accounts') || '{}')
    if (users[inputUser]) return alert('Username already taken.')
    users[inputUser] = inputPass
    localStorage.setItem('sweatstreak_accounts', JSON.stringify(users))
    alert('✅ Account created! Please log in.')
    setPage('login')
  }

  function handleLogin(): void {
    const users: Record<string, string> = JSON.parse(localStorage.getItem('sweatstreak_accounts') || '{}')
    if (users[inputUser] === inputPass) {
      setUsername(inputUser)
      setLoggedIn(true)
      setPage('app')
      localStorage.setItem('sweatstreak_user', inputUser)
    } else alert('Invalid username or password.')
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
  }

  function capturePhoto(): void {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        setPreview(imageSrc)
        setShowCamera(false)
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
      caption: "Just finished today's workout 💪",
      date: todayISO,
      likes: [],
      comments: [],
    }

    const updated = [newPost, ...posts]
    savePosts(updated)

    friends.forEach(friend => {
      const friendNotifications: string[] = JSON.parse(localStorage.getItem(`notifications_${friend}`) || '[]')
      friendNotifications.push(`${username} just posted their SweatStreak! 🔥`)
      localStorage.setItem(`notifications_${friend}`, JSON.stringify(friendNotifications))
    })

    setPreview(null)
    setShowCamera(false)
    setView('feed')
  }

  // --- FRIENDS ---
  function handleAddFriend(): void {
    if (!friendInput.trim()) return alert('Enter a username to add.')
    const users: Record<string, string> = JSON.parse(localStorage.getItem('sweatstreak_accounts') || '{}')
    if (!users[friendInput]) return alert('That user doesn’t exist.')
    if (friends.includes(friendInput)) return alert('Already added.')
    const newFriends = [...friends, friendInput]
    setFriends(newFriends)
    localStorage.setItem(`friends_${username}`, JSON.stringify(newFriends))
    setFriendInput('')
    alert('✅ Friend added!')
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
      p.id === postId
        ? { ...p, comments: [...p.comments, { user: username, text }] }
        : p
    )
    savePosts(updated)
    setCommentInputs({ ...commentInputs, [postId]: '' })
  }

  // --- LOGIN / SIGNUP SCREENS ---
  if (!loggedIn && page === 'signup') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#3A47FF] text-white">
        <div className="bg-white p-10 rounded-xl w-full max-w-sm text-center shadow-lg border border-white text-black">
          <h1 className={`${bubbleFont.className} text-4xl mb-6 text-black`}>SweatStreak</h1>
          <input placeholder="Username" value={inputUser} onChange={e => setInputUser(e.target.value)} className="w-full mb-3 p-2 rounded border border-gray-300" />
          <input type="password" placeholder="Password" value={inputPass} onChange={e => setInputPass(e.target.value)} className="w-full mb-4 p-2 rounded border border-gray-300" />
          <button onClick={handleSignup} className="w-full bg-black text-white py-2 rounded mb-3">Sign Up</button>
          <button onClick={() => setPage('login')} className="text-sm text-gray-800 hover:text-black">Already have an account? Log in</button>
        </div>
      </div>
    )
  }

  if (!loggedIn && page === 'login') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#3A47FF] text-white">
        <div className="bg-white p-10 rounded-xl w-full max-w-sm text-center shadow-lg border border-white text-black">
          <h1 className={`${bubbleFont.className} text-4xl mb-6 text-black`}>SweatStreak</h1>
          <input placeholder="Username" value={inputUser} onChange={e => setInputUser(e.target.value)} className="w-full mb-3 p-2 rounded border border-gray-300" />
          <input type="password" placeholder="Password" value={inputPass} onChange={e => setInputPass(e.target.value)} className="w-full mb-4 p-2 rounded border border-gray-300" />
          <button onClick={handleLogin} className="w-full bg-black text-white py-2 rounded mb-3">Log In</button>
          <button onClick={() => setPage('signup')} className="text-sm text-gray-800 hover:text-black">Don’t have an account? Sign up</button>
        </div>
      </div>
    )
  }

  // --- MAIN APP ---
  const feedPosts = posts.filter(p => p.user === username || friends.includes(p.user))

  return (
    <div className="flex min-h-screen text-white bg-[#3A47FF]">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col p-5 border-r border-white shadow-md">
        <h1 className={`${bubbleFont.className} text-2xl mb-6 text-white`}>SweatStreak</h1>
        <p className="text-sm mb-8">@{username}</p>
        <nav className="flex flex-col gap-3 flex-1">
          <button onClick={() => setView('feed')} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded-md"><Home /> Feed</button>
          <button onClick={() => setView('camera')} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded-md"><Camera /> Take Photo</button>
          <button onClick={() => setView('friends')} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded-md"><Users /> Friends</button>
          <button onClick={() => setView('progress')} className="flex items-center gap-3 p-2 hover:bg-white/20 rounded-md"><Gallery /> My Progress</button>
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-2 text-white hover:text-gray-200 mt-6"><LogOut /> Logout</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Camera */}
        {view === 'camera' && (
          <section className="text-center">
            <h2 className={`${bubbleFont.className} text-3xl mb-4 text-white`}>Take Your Daily Photo</h2>
            {!showCamera && !preview && (
              <button onClick={openCamera} className="bg-white text-black px-8 py-3 rounded-md font-bold hover:bg-gray-200">Open Camera</button>
            )}
            {cameraError && <p className="text-red-200 mt-4">{cameraError}</p>}
            {showCamera && (
              <div className="flex flex-col items-center gap-4 mt-6">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
                  className="rounded-lg border-4 border-white w-[320px] h-[240px] object-cover"
                />
                <button onClick={capturePhoto} className="bg-white text-black px-8 py-2 rounded-md font-bold">Capture</button>
                <button onClick={() => setShowCamera(false)} className="text-white hover:text-gray-300">Close</button>
              </div>
            )}
            {preview && (
              <div className="flex flex-col items-center gap-4 mt-6">
                <img src={preview} alt="Preview" className="rounded-lg border-4 border-white w-[320px]" />
                <div className="flex gap-3">
                  <button onClick={confirmPhoto} className="bg-white text-black px-6 py-2 rounded-md font-bold">Post</button>
                  <button onClick={() => setPreview(null)} className="bg-black text-white px-6 py-2 rounded-md">Retake</button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Feed */}
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
                    <p className="font-semibold text-white">@{post.user}</p>
                    <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1">
                      <Heart fill={post.likes.includes(username) ? 'red' : 'none'} /> {post.likes.length}
                    </button>
                  </div>
                  <p>{post.caption}</p>
                  <p className="text-xs text-gray-200 mb-2">{post.date}</p>
                  <div className="mt-2">
                    {post.comments.map((c, i) => (
                      <p key={i} className="text-sm text-white"><strong>@{c.user}:</strong> {c.text}</p>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Add comment..."
                        value={commentInputs[post.id] || ''}
                        onChange={e => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        className="flex-1 p-1 text-black rounded-md border border-white"
                      />
                      <button onClick={() => addComment(post.id)} className="bg-white text-black px-3 rounded-md font-bold">💬</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* Friends */}
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
              <button onClick={handleAddFriend} className="bg-white text-black px-4 py-2 rounded-md font-bold">Add</button>
            </div>
            {friends.length === 0 ? (
              <p>You haven’t added any friends yet.</p>
            ) : (
              <ul className="space-y-2">
                {friends.map(f => (
                  <li key={f} className="bg-[#3A47FF]/50 p-3 rounded-md border border-white shadow-sm">@{f}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Progress */}
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
      </main>
    </div>
  )
}
