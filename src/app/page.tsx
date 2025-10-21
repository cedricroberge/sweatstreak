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
  ArrowLeft,
  Settings as SettingsIcon,
  Mail,
  Shield,
  Bell,
  EyeOff
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
  location?: string
  isPrivate?: boolean
  notificationsEnabled?: boolean
}

export default function SweatStreakApp() {
  const [page, setPage] = useState<'signup' | 'login' | 'app'>('signup')
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [inputUser, setInputUser] = useState('')
  const [inputPass, setInputPass] = useState('')
  const [inputEmail, setInputEmail] = useState('')
  const [view, setView] = useState<
    'feed' | 'camera' | 'friends' | 'progress' | 'profile' | 'friendProfile' | 'settings' | 'followersList' | 'followingList'
  >('camera')
  const [posts, setPosts] = useState<Post[]>([])
  const [friends, setFriends] = useState<string[]>([]) // legacy, kept
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

  // 🆕 profile/settings additions
  const [profileLocation, setProfileLocation] = useState('')
  const [accountPrivate, setAccountPrivate] = useState(false)
  const [notifEnabled, setNotifEnabled] = useState(true)

  // 🆕 following system + UI state
  const [feedScope, setFeedScope] = useState<'following' | 'public'>('following')

  // 🆕 force re-render after follow/unfollow/block
  const [socialVersion, setSocialVersion] = useState(0)

  // Helpers
  const getAccounts = (): Record<string, Account> =>
    JSON.parse(localStorage.getItem('sweatstreak_accounts') || '{}')
  const setAccounts = (obj: Record<string, Account>) =>
    localStorage.setItem('sweatstreak_accounts', JSON.stringify(obj))

  const getUserPic = (u: string): string | undefined => {
    const a = getAccounts()[u]
    return a?.profilePic || undefined
  }

  const getFollowing = (u: string): string[] =>
    JSON.parse(localStorage.getItem(`following_${u}`) || '[]')
  const setFollowing = (u: string, arr: string[]) => {
    localStorage.setItem(`following_${u}`, JSON.stringify(arr))
  }

  const getFollowers = (u: string): string[] =>
    JSON.parse(localStorage.getItem(`followers_${u}`) || '[]')
  const setFollowers = (u: string, arr: string[]) => {
    localStorage.setItem(`followers_${u}`, JSON.stringify(arr))
  }

  const getBlocked = (u: string): string[] =>
    JSON.parse(localStorage.getItem(`blocked_${u}`) || '[]')
  const setBlocked = (u: string, arr: string[]) => {
    localStorage.setItem(`blocked_${u}`, JSON.stringify(arr))
  }

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
      const userFriends: string[] = JSON.parse(localStorage.getItem(`friends_${username}`) || '[]') // legacy
      setPosts(allPosts)
      setFriends(userFriends)
      const users: Record<string, Account> = getAccounts()
      const me = users[username]
      if (me) {
        setProfileBio(me.bio || '')
        setProfilePic(me.profilePic || null)
        setProfileLocation(me.location || '')
        setAccountPrivate(!!me.isPrivate)
        setNotifEnabled(me.notificationsEnabled !== false)
      }
    }
  }, [loggedIn, username, socialVersion])

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
    const users: Record<string, Account> = getAccounts()
    if (Object.values(users).some(u => u.username === inputUser || u.email === inputEmail))
      return alert('Email or username already taken.')
    users[inputUser] = {
      email: inputEmail,
      username: inputUser,
      password: inputPass,
      bio: '',
      profilePic: '',
      location: '',
      isPrivate: false,
      notificationsEnabled: true,
    }
    setAccounts(users)
    localStorage.setItem('sweatstreak_user', inputUser)
    setUsername(inputUser)
    setLoggedIn(true)
    setPage('app')
    alert('✅ Account created and logged in!')
  }

  function handleLogin(): void {
    const users: Record<string, Account> = getAccounts()
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

    // Notify followers that I posted
    const followers = getFollowers(username)
    const users = getAccounts()
    followers.forEach(f => {
      const followerSettings = users[f]
      if (followerSettings?.notificationsEnabled !== false) {
        const n: string[] = JSON.parse(localStorage.getItem(`notifications_${f}`) || '[]')
        n.push(`${username} just posted their SweatStreak! 🔥`)
        localStorage.setItem(`notifications_${f}`, JSON.stringify(n))
      }
    })

    // keep legacy friend notifications
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

  // --- FRIENDS (legacy kept) + FOLLOWING (new) ---
  function handleAddFriend(): void {
    if (!friendInput.trim()) return alert('Enter a username to add.')
    const users: Record<string, Account> = getAccounts()
    if (!users[friendInput]) return alert('That user doesn’t exist.')
    if (friends.includes(friendInput)) return alert('Already added.')
    const newFriends = [...friends, friendInput]
    setFriends(newFriends)
    localStorage.setItem(`friends_${username}`, JSON.stringify(newFriends))
    setFriendInput('')
    alert('✅ Friend added!')
  }

  function previewFriend(): void {
    const users: Record<string, Account> = getAccounts()
    const found = users[friendInput]
    if (found) setFriendPreview(found)
    else setFriendPreview(null)
  }

  function openFriendProfile(friend: Account) {
    setActiveFriend(friend)
    setView('friendProfile')
  }

  // 🆕 FOLLOW/UNFOLLOW (force refresh with socialVersion)
  function followUser(target: string) {
    if (!target || target === username) return
    const users = getAccounts()
    if (!users[target]) return alert('User not found.')
    const myFollowing = getFollowing(username)
    if (myFollowing.includes(target)) return alert('Already following.')
    setFollowing(username, [...myFollowing, target])
    const theirFollowers = getFollowers(target)
    setFollowers(target, [...theirFollowers, username])
    setSocialVersion(v => v + 1)
    alert(`✅ You are now following @${target}`)
  }

  function unfollowUser(target: string) {
    if (!target || target === username) return
    const myFollowing = getFollowing(username)
    setFollowing(username, myFollowing.filter(u => u !== target))
    const theirFollowers = getFollowers(target)
    setFollowers(target, theirFollowers.filter(u => u !== username))
    setSocialVersion(v => v + 1)
    alert(`👋 Unfollowed @${target}`)
  }

  // --- PROFILE ---
  function saveProfileChanges() {
    const users: Record<string, Account> = getAccounts()
    if (users[username]) {
      users[username] = {
        ...users[username],
        bio: profileBio,
        profilePic: profilePic || '',
        location: profileLocation || '',
        isPrivate: accountPrivate,
        notificationsEnabled: notifEnabled,
      }
      setAccounts(users)
      setSocialVersion(v => v + 1)
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

  // Safety: camera overlay vs menu
  useEffect(() => {
    if (menuOpen) setFullscreenCam(false)
  }, [menuOpen])
  useEffect(() => {
    if (fullscreenCam && view !== 'camera') setFullscreenCam(false)
  }, [view, fullscreenCam])

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
    (p) =>
      (p.user === username || friends.includes(p.user)) &&
      (p.visibility === 'public' || p.user === username)
  ); // keep legacy feed calc

  // 🆕 Derived feeds
  const myFollowing = getFollowing(username)
  const myBlocked = getBlocked(username)
  const usersMap = getAccounts()

  const derivedFollowingFeed = posts.filter(p => {
    if (myBlocked.includes(p.user)) return false
    if (p.user === username) return true
    const acct = usersMap[p.user]
    const isPrivate = acct?.isPrivate
    const isFollowed = myFollowing.includes(p.user)
    if (isPrivate) return isFollowed
    return isFollowed
  })

  const derivedPublicFeed = posts.filter(p => {
    if (myBlocked.includes(p.user)) return false
    const acct = usersMap[p.user]
    const isPrivate = acct?.isPrivate
    if (isPrivate) return false
    return p.visibility === 'public'
  })

  const tabFeed = feedScope === 'following' ? derivedFollowingFeed : derivedPublicFeed

  // counts
  const followersCount = getFollowers(username).length
  const followingCount = myFollowing.length
  const myPostsCount = posts.filter(p => p.user === username).length

  // list views
  const openFollowersList = () => { setView('followersList') }
  const openFollowingList = () => { setView('followingList') }

  return (
    <div className="flex min-h-screen text-white bg-[#3A47FF] relative">
      {/* Global CSS */}
      <style jsx global>{`
        img[alt="Profile"] {
          width: 40px !important;
          height: 40px !important;
          object-fit: cover;
        }
        .avatar-sm { width: 32px; height: 32px; border-radius: 9999px; object-fit: cover; }
        .avatar-md { width: 56px !important; height: 56px !important; border-radius: 9999px; object-fit: cover; }

        /* hide duplicate username in legacy header row (keep like button) */
        .flex.items-center.gap-2.mb-2 + .flex.justify-between.items-center.mb-2 > button:first-child {
          display: none !important;
        }

        /* hide legacy big trio in profile (we use compact row) */
        .text-center > img[alt="Profile"],
        .text-center > p.text-lg.font-bold,
        .text-center > p.text-sm.italic.text-gray-200.mb-4 {
          display: none !important;
        }

        /* hide legacy feed cards to avoid dupes */
        .shadow-sm.text-left { display: none !important; }

        /* 🔧 make the profile stats row buttons match post cards */
        .stats-row button {
          background: rgba(58,71,255,0.5) !important; /* like your post cards */
          border: 1px solid white !important;
          border-radius: 0.5rem !important;
          padding: 0.5rem 1rem !important;
          color: white !important;
          min-width: 110px;
        }
      `}</style>

      {/* Hamburger Menu */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white text-black p-2 rounded-md shadow-lg"
        aria-label="Open menu"
      >
        <Menu />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:relative top-0 left-0 h-full w-48 md:w-56 lg:w-60 flex flex-col p-4 border-r border-white shadow-md bg-[#3A47FF] transform ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-40`}
        aria-label="Sidebar"
      >
        <h1 className={`${bubbleFont.className} text-xl md:text-2xl mb-4 text-white`}>SweatStreak</h1>

        {/* small avatar + username */}
        <div className="flex items-center gap-2 mb-2">
          {profilePic ? (
            <img src={profilePic} alt="Me" className="avatar-sm border border-white" />
          ) : (
            <div className="avatar-sm border border-white flex items-center justify-center text-xs">👤</div>
          )}
          <span className="text-xs md:text-sm">@{username}</span>
        </div>

        {/* original username line (kept) */}
        <p className="text-xs md:text-sm mb-4">@{username}</p>

        <nav className="flex flex-col gap-3 flex-1">
          <button onClick={() => { setView('feed'); setMenuOpen(false) }} className="flex items-center gap-2 p-2 hover:bg-white/20 rounded-md"><Home /> Feed</button>
          <button onClick={() => { setView('camera'); setMenuOpen(false) }} className="flex items-center gap-2 p-2 hover:bg-white/20 rounded-md"><Camera /> Take Photo</button>
          {/* renamed label only */}
          <button onClick={() => { setView('friends'); setMenuOpen(false) }} className="flex items-center gap-2 p-2 hover:bg-white/20 rounded-md"><Users /> Following</button>
          <button onClick={() => { setView('progress'); setMenuOpen(false) }} className="flex items-center gap-2 p-2 hover:bg-white/20 rounded-md"><Gallery /> My Progress</button>
          <button onClick={() => { setView('profile'); setMenuOpen(false) }} className="flex items-center gap-2 p-2 hover:bg-white/20 rounded-md"><User /> Profile</button>
          <button onClick={() => { setView('settings'); setMenuOpen(false) }} className="flex items-center gap-2 p-2 hover:bg-white/20 rounded-md"><SettingsIcon /> Settings</button>
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
              <button onClick={capturePhoto} className="bg-red-500 text-white px-6 py-2 rounded-md font-bold text-lg">
                Take Picture
              </button>
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
            <h2 className={`${bubbleFont.className} text-3xl mb-2 text-white`}>Feed</h2>

            {/* Tabs: Following / Public */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                className={`px-4 py-2 rounded-full font-bold border ${feedScope === 'following' ? 'bg-white text-black' : 'bg-transparent border-white'}`}
                onClick={() => setFeedScope('following')}
              >
                Following
              </button>
              <button
                className={`px-4 py-2 rounded-full font-bold border ${feedScope === 'public' ? 'bg-white text-black' : 'bg-transparent border-white'}`}
                onClick={() => setFeedScope('public')}
              >
                Public
              </button>
            </div>

            {tabFeed.length === 0 ? (
              <p>No posts yet.</p>
            ) : (
              <div className="space-y-5">
                {tabFeed.map(post => (
                  <div key={post.id} className="bg-[#3A47FF]/50 p-4 rounded-lg border border-white shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      {getUserPic(post.user) ? (
                        <img src={getUserPic(post.user)} alt={post.user} className="avatar-sm border border-white" />
                      ) : (
                        <div className="avatar-sm border border-white flex items-center justify-center text-xs">👤</div>
                      )}
                      <button
                        onClick={() => {
                          const users = JSON.parse(localStorage.getItem('sweatstreak_accounts') || '{}')
                          if (users[post.user]) openFriendProfile(users[post.user])
                        }}
                        className="font-semibold underline"
                      >
                        @{post.user}
                      </button>
                      <span className="ml-auto text-xs opacity-80">{post.date}</span>
                    </div>

                    <img src={post.image} alt={post.caption} className="rounded-lg mb-3 w-full object-cover border border-white" />

                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">{post.caption}</p>
                      <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1">
                        <Heart fill={post.likes.includes(username) ? 'red' : 'none'} /> {post.likes.length}
                      </button>
                    </div>

                    <div className="mt-2">
                      {post.comments.map((c, i) => (
                        <p key={i} className="text-sm">
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
                ))}
              </div>
            )}

            {/* legacy list hidden via CSS */}
          </section>
        )}

        {/* Following Section (renamed UI; legacy 'friends' view kept) */}
        {view === 'friends' && (
          <section>
            <h2 className={`${bubbleFont.className} text-3xl mb-6 text-white`}>Following</h2>
            <div className="flex gap-3 mb-4">
              <input
                value={friendInput}
                onChange={e => setFriendInput(e.target.value)}
                placeholder="Search username"
                className="p-2 rounded-md text-black flex-1 border border-white"
              />
              <button onClick={previewFriend} className="bg-white text-black px-4 py-2 rounded-md font-bold">
                Search
              </button>
            </div>
            {friendPreview && (
              <div className="bg-white/10 p-4 rounded-md mb-4">
                {friendPreview.profilePic && (
                  <img src={friendPreview.profilePic} className="avatar-md mx-auto mb-2 border border-white" />
                )}
                <p className="text-center font-bold">@{friendPreview.username}</p>
                <div className="text-center text-sm opacity-80 mb-2">
                  {friendPreview.bio || 'No bio yet.'}{friendPreview.location ? ` — ${friendPreview.location}` : ''}
                </div>
                <div className="flex justify-center gap-3 mt-2">
                  <button onClick={() => openFriendProfile(friendPreview)} className="bg-white text-black px-3 py-1 rounded">
                    View Profile
                  </button>
                  {getFollowing(username).includes(friendPreview.username) ? (
                    <button onClick={() => unfollowUser(friendPreview.username)} className="bg-black text-white px-3 py-1 rounded">
                      Unfollow
                    </button>
                  ) : (
                    <button onClick={() => followUser(friendPreview.username)} className="bg-green-500 text-white px-3 py-1 rounded">
                      Follow
                    </button>
                  )}
                  {/* Legacy add friend (kept) */}
                  {!friends.includes(friendPreview.username) && (
                    <button onClick={handleAddFriend} className="bg-blue-500 text-white px-3 py-1 rounded">
                      Add Friend (legacy)
                    </button>
                  )}
                </div>
              </div>
            )}
            {/* legacy friends list kept (could represent "people you might follow") */}
            {friends.length === 0 ? (
              <p>No users yet.</p>
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
            {/* settings button */}
            <div className="flex items-center justify-between">
              <h2 className={`${bubbleFont.className} text-3xl mb-6 text-white`}>My Profile</h2>
              <button onClick={() => setView('settings')} className="flex items-center gap-2 bg-white text-black px-3 py-1 rounded-md font-bold">
                <SettingsIcon size={18}/> Settings
              </button>
            </div>

            {!editingProfile ? (
              <div className="text-center">
                {profilePic && <img src={profilePic} alt="Profile" className="w-24 h-24 rounded-full mx-auto mb-3 border-2 border-white" />}
                <p className="text-lg font-bold">@{username}</p>
                <p className="text-sm italic text-gray-200 mb-4">{profileBio || 'No bio yet.'}</p>

                {/* compact row */}
                <div className="flex items-center gap-3 justify-center mb-4">
                  {profilePic ? (
                    <img src={profilePic} alt="mini" className="avatar-md border border-white" />
                  ) : (
                    <div className="avatar-md border border-white flex items-center justify-center">👤</div>
                  )}
                  <div className="text-left">
                    <div className="font-bold">@{username}</div>
                    <div className="text-xs italic text-gray-200 max-w-xs">
                      {profileBio || 'No bio yet.'}{profileLocation ? ` — ${profileLocation}` : ''}
                    </div>
                  </div>
                </div>

                {/* stats row styled like posts */}
                <div className="stats-row flex items-center justify-center gap-4 mb-4">
                  <button onClick={openFollowersList} className="text-center">
                    <div className="text-xl font-bold">{followersCount}</div>
                    <div className="text-xs opacity-80">Followers</div>
                  </button>
                  <button onClick={openFollowingList} className="text-center">
                    <div className="text-xl font-bold">{followingCount}</div>
                    <div className="text-xs opacity-80">Following</div>
                  </button>
                  <button className="text-center cursor-default">
                    <div className="text-xl font-bold">{myPostsCount}</div>
                    <div className="text-xs opacity-80">Posts</div>
                  </button>
                </div>

                <button onClick={() => setEditingProfile(true)} className="bg-white text-black px-4 py-2 rounded-md font-bold">Edit Profile</button>
              </div>
            ) : (
              <div className="max-w-md mx-auto bg-white/10 p-4 rounded-md">
                <label className="block mb-2 font-bold">Bio:</label>
                <textarea value={profileBio} onChange={e => setProfileBio(e.target.value)} className="w-full p-2 rounded text-black mb-3" />

                <label className="block mb-2 font-bold">Location (City, State):</label>
                <input value={profileLocation} onChange={e => setProfileLocation(e.target.value)} className="w-full p-2 rounded text-black mb-3" placeholder="e.g., Eugene, OR" />

                <label className="block mb-2 font-bold">Profile Picture:</label>
                <input type="file" accept="image/*" onChange={handleProfilePicChange} className="mb-3" />

                <div className="flex items-center gap-4 mb-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={accountPrivate} onChange={e => setAccountPrivate(e.target.checked)} />
                    Private account
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={notifEnabled} onChange={e => setNotifEnabled(e.target.checked)} />
                    Notifications
                  </label>
                </div>

                <div className="flex justify-center gap-3">
                  <button onClick={saveProfileChanges} className="bg-white text-black px-4 py-2 rounded-md font-bold">Save</button>
                  <button onClick={() => setEditingProfile(false)} className="bg-black text-white px-4 py-2 rounded-md">Cancel</button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Followers / Following Lists */}
        {view === 'followersList' && (
          <section>
            <button onClick={() => setView('profile')} className="mb-4 underline">&larr; Back to Profile</button>
            <h2 className={`${bubbleFont.className} text-2xl mb-4`}>Followers</h2>
            <ul className="space-y-2">
              {getFollowers(username).map(u => (
                <li key={u} className="bg-white/10 p-3 rounded flex items-center gap-3">
                  {getUserPic(u) ? <img src={getUserPic(u)} className="avatar-sm border border-white" /> : <div className="avatar-sm border border-white flex items-center justify-center">👤</div>}
                  <span>@{u}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {view === 'followingList' && (
          <section>
            <button onClick={() => setView('profile')} className="mb-4 underline">&larr; Back to Profile</button>
            <h2 className={`${bubbleFont.className} text-2xl mb-4`}>Following</h2>
            <ul className="space-y-2">
              {getFollowing(username).map(u => (
                <li key={u} className="bg-white/10 p-3 rounded flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    {getUserPic(u) ? <img src={getUserPic(u)} className="avatar-sm border border-white" /> : <div className="avatar-sm border border-white flex items-center justify-center">👤</div>}
                    <span>@{u}</span>
                  </div>
                  <button onClick={() => unfollowUser(u)} className="text-xs underline">Unfollow</button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Friend (followed user) Profile */}
        {view === 'friendProfile' && activeFriend && (
          <section>
            <button onClick={() => setView('friends')} className="flex items-center gap-2 mb-4"><ArrowLeft /> Back</button>
            <div className="text-center mb-6">
              {activeFriend.profilePic && <img src={activeFriend.profilePic} className="avatar-md mx-auto mb-3 border border-white" />}
              <p className="font-bold text-xl">@{activeFriend.username}</p>
              <p className="text-sm italic text-gray-200">
                {activeFriend.bio || 'No bio yet.'}{activeFriend.location ? ` — ${activeFriend.location}` : ''}
              </p>

              <div className="flex items-center justify-center gap-8 mt-3">
                <div className="text-center">
                  <div className="text-xl font-bold">{getFollowers(activeFriend.username).length}</div>
                  <div className="text-xs opacity-80">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">{getFollowing(activeFriend.username).length}</div>
                  <div className="text-xs opacity-80">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">{posts.filter(p => p.user === activeFriend.username && (activeFriend.isPrivate ? getFollowing(username).includes(activeFriend.username) : true)).length}</div>
                  <div className="text-xs opacity-80">Posts</div>
                </div>
              </div>

              <div className="flex justify-center gap-3 mt-3">
                {getFollowing(username).includes(activeFriend.username) ? (
                  <button onClick={() => unfollowUser(activeFriend.username)} className="bg-black text-white px-4 py-2 rounded-md">
                    Unfollow
                  </button>
                ) : (
                  <button onClick={() => followUser(activeFriend.username)} className="bg-green-500 text-white px-4 py-2 rounded-md">
                    Follow
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {posts
                .filter(p => {
                  const isOwner = p.user === activeFriend.username
                  if (!isOwner) return false
                  const acct = usersMap[activeFriend.username]
                  if (acct?.isPrivate && !getFollowing(username).includes(activeFriend.username)) return false
                  if (p.visibility === 'private' && !getFollowing(username).includes(activeFriend.username)) return false
                  return true
                })
                .map(p => (
                  <div key={p.id} className="bg-[#3A47FF]/50 p-2 rounded-lg border border-white text-center">
                    <img src={p.image} alt={p.caption} className="rounded-lg mb-2 border border-white" />
                    <p className="text-xs text-gray-100">{p.caption}</p>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Settings */}
        {view === 'settings' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`${bubbleFont.className} text-3xl`}>Settings</h2>
              <button onClick={() => setView('profile')} className="underline">Done</button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 p-4 rounded-md">
                <div className="flex items-center gap-2 font-bold mb-3"><Bell size={18}/> Notifications</div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notifEnabled}
                    onChange={e => {
                      setNotifEnabled(e.target.checked)
                      const accs = getAccounts()
                      if (accs[username]) {
                        accs[username].notificationsEnabled = e.target.checked
                        setAccounts(accs)
                        setSocialVersion(v => v + 1)
                      }
                    }}
                  />
                  Enable notifications
                </label>
              </div>

              <div className="bg-white/10 p-4 rounded-md">
                <div className="flex items-center gap-2 font-bold mb-3"><Shield size={18}/> Privacy</div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={accountPrivate}
                    onChange={e => {
                      setAccountPrivate(e.target.checked)
                      const accs = getAccounts()
                      if (accs[username]) {
                        accs[username].isPrivate = e.target.checked
                        setAccounts(accs)
                        setSocialVersion(v => v + 1)
                      }
                    }}
                  />
                  Make my account private (only followers can see my posts)
                </label>
              </div>

              <div className="bg-white/10 p-4 rounded-md md:col-span-2">
                <div className="flex items-center gap-2 font-bold mb-3"><EyeOff size={18}/> Block Users</div>
                <div className="flex gap-2 mb-3">
                  <input
                    className="flex-1 p-2 rounded text-black"
                    value={friendInput}
                    onChange={e => setFriendInput(e.target.value)}
                    placeholder="Enter username to block"
                  />
                  <button
                    className="bg-black px-3 py-2 rounded-md"
                    onClick={() => {
                      const target = friendInput.trim()
                      if (!target) return
                      const list = getBlocked(username)
                      if (!list.includes(target)) {
                        setBlocked(username, [...list, target])
                        setSocialVersion(v => v + 1)
                        alert(`🚫 Blocked @${target}`)
                      }
                      setFriendInput('')
                    }}
                  >
                    Block
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getBlocked(username).map(u => (
                    <span key={u} className="bg-white/20 px-2 py-1 rounded-full text-sm">
                      @{u}{' '}
                      <button className="underline ml-1" onClick={() => { setBlocked(username, getBlocked(username).filter(x => x !== u)); setSocialVersion(v => v + 1) }}>
                        Unblock
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/10 p-4 rounded-md md:col-span-2">
                <div className="flex items-center gap-2 font-bold mb-3"><Mail size={18}/> Help</div>
                <p className="mb-3">
                  Need support? Email us at{' '}
                  <a href="mailto:cedricroberge10@gmail.com" className="underline">cedricroberge10@gmail.com</a>
                </p>
                <div className="border-t border-white/20 pt-3">
                  <p className="font-bold mb-2">Apply as an Influencer</p>
                  {getFollowers(username).length >= 10000 ? (
                    <InfluencerForm defaultEmail={getAccounts()[username]?.email || ''} defaultUsername={username} />
                  ) : (
                    <p>You need at least <strong>10,000 followers</strong> to apply. Current: {getFollowers(username).length.toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function InfluencerForm({ defaultEmail, defaultUsername }: { defaultEmail: string; defaultUsername: string }) {
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [email, setEmail] = useState(defaultEmail)
  const [job, setJob] = useState('')
  const [desired, setDesired] = useState(defaultUsername)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        alert(`✅ Application submitted!\nName: ${first} ${last}\nEmail: ${email}\nJob: ${job}\nDesired: ${desired}`)
      }}
      className="grid md:grid-cols-2 gap-3"
    >
      <input value={first} onChange={e => setFirst(e.target.value)} placeholder="First name" className="p-2 rounded text-black" required />
      <input value={last} onChange={e => setLast(e.target.value)} placeholder="Last name" className="p-2 rounded text-black" required />
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="p-2 rounded text-black md:col-span-2" required />
      <input value={job} onChange={e => setJob(e.target.value)} placeholder="Job" className="p-2 rounded text-black md:col-span-2" />
      <input value={desired} onChange={e => setDesired(e.target.value)} placeholder="Desired username" className="p-2 rounded text-black md:col-span-2" />
      <div className="md:col-span-2">
        <button type="submit" className="bg-white text-black px-4 py-2 rounded-md font-bold">Submit</button>
      </div>
    </form>
  )
}
