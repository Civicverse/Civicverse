import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { CharacterViewer } from '../components/3d/CharacterViewer'
import { CIVICVERSE_LOGO } from '../assets/logo'
import {
  Shield,
  Check,
  QrCode,
  UserPlus,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Music,
  Copy,
  Lock,
  MessageSquare,
  UserCheck,
  Heart,
  Send,
  Plus,
  Trash2,
  Radio,
  Eye,
  EyeOff,
  ShoppingBag,
  Coins,
  Landmark,
  Upload,
  FileAudio,
  Clock,
  RefreshCw,
  Calendar,
  Download,
  CheckCircle2,
  Edit3,
  Video,
  Film,
  Tv,
  Settings,
  Share2,
  Monitor,
  Volume2,
  VolumeX,
  Sliders,
  Maximize2
} from 'lucide-react'
import {
  setFoyerBroadcast,
  FoyerBroadcastTrack,
  UserVideo,
  getUserBroadcastVideos,
  setUserBroadcastVideos,
  isGlobalSharingEnabled,
  setGlobalSharingEnabled,
  isFoyerFmSharingEnabled,
  setFoyerFmSharingEnabled
} from '../services/mediaService'

export interface UserSong {
  id: string
  title: string
  artist: string
  url: string // audio URL or Base64 data URL
  priceRights: number // in XMR (e.g. 0.0065 = $1.00/mo)
  priceOutright: number // in XMR (e.g. 0.0774 = $12.00 outright)
  isBroadcast: boolean
  sellerAddress?: string // Monero wallet address
}

export interface BoughtSong {
  id: string
  title: string
  artist: string
  url: string
  purchasedAt: number
  amountXmr: number
  sellerAddress?: string
  license: string
}

export interface RentedSong {
  id: string
  title: string
  artist: string
  url: string
  rentedAt: number
  expiresAt: number
  autoRenew: boolean
  priceRights: number // in XMR (0.0065 = $1.00/mo)
  sellerAddress?: string
  license: string
}

export interface UserFriend {
  id: string
  username: string
  civicId: string
  avatar: string
}

function extractAboutMeText(markup: string) {
  if (typeof DOMParser === 'undefined' || !markup) return markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const document = new DOMParser().parseFromString(markup, 'text/html')
  document.querySelectorAll('style, script, iframe, noscript').forEach(node => node.remove())
  return (document.body.textContent || '').replace(/\s+/g, ' ').trim()
}

export default function CivicVaultPage() {
  const nav = useNavigate()
  const { user: rawUser, logout, tempMnemonic, updateUser, multiChainAddresses } = useGameStore()

  const isGuestMode = !rawUser

  const user = rawUser || {
    civicId: 'did:civic:guest_' + Math.random().toString(36).substring(2, 8),
    username: 'Player1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player1',
    trustScore: 75,
    level: 1,
    verificationLevel: 1,
    attestationCount: 1,
    character: {
      skinColor: '#e0ac69',
      hairColor: '#4a3b2a',
      shirtColor: '#00d9ff',
      pantsColor: '#1a1a2e',
      shoesColor: '#333333',
      hairStyle: 'short' as const,
      accessory: 'none' as const,
      bodyType: 'athletic' as const
    }
  }

  // PoP Dropdown state
  const [showPopDropdown, setShowPopDropdown] = useState(false)
  const popDropdownRef = useRef<HTMLDivElement>(null)

  // PoP Verification Modal states
  const [verifying, setVerifying] = useState(false)
  const [verifStep, setVerifStep] = useState(1)
  const [verifCode, setVerifCode] = useState('')
  const [peerPassInput, setPeerPassInput] = useState('')
  const [verifError, setVerifError] = useState('')

  // Seed phrase toggle
  const [showSeed, setShowSeed] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  // ---------------------------------------------------------------------------
  // Real PimpMyProfile Embed Code & About Me State
  // ---------------------------------------------------------------------------
  const [customEmbedCode, setCustomEmbedCode] = useState<string>(() => {
    return localStorage.getItem('civicverse:myspace:embed_code') || ''
  })
  const [embedCodeDraft, setEmbedCodeDraft] = useState(customEmbedCode)
  const [aboutMe, setAboutMe] = useState(() => localStorage.getItem('civicverse:myspace:about_me') || '')
  const [aboutMeDraft, setAboutMeDraft] = useState(aboutMe)
  const [isEditingAboutMe, setIsEditingAboutMe] = useState(false)
  const [aboutMeSaveStatus, setAboutMeSaveStatus] = useState<string>('')
  const visibleAboutMe = aboutMe.trim() || extractAboutMeText(customEmbedCode)

  // Check if a custom MySpace layout or theme is active
  const hasCustomTheme = Boolean(
    customEmbedCode &&
      customEmbedCode.trim().length > 0 &&
      (customEmbedCode.toLowerCase().includes('<style') ||
        customEmbedCode.toLowerCase().includes('background') ||
        customEmbedCode.toLowerCase().includes('pimp') ||
        customEmbedCode.toLowerCase().includes('<table') ||
        customEmbedCode.toLowerCase().includes('body') ||
        customEmbedCode.toLowerCase().includes('http') ||
        customEmbedCode.toLowerCase().includes('<div') ||
        customEmbedCode.toLowerCase().includes('<img') ||
        customEmbedCode.toLowerCase().includes('url('))
  )

  // Extract background image URL if present in the custom layout code
  const customBgUrl = React.useMemo(() => {
    if (!customEmbedCode) return null
    const match = customEmbedCode.match(/url\(['"]?([^'")\s]+)['"]?\)/i)
    return match ? match[1] : null
  }, [customEmbedCode])

  // Extract background color if present in the custom layout code
  const customBgColor = React.useMemo(() => {
    if (!customEmbedCode) return null
    const colorMatch = customEmbedCode.match(/background-color\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)/i)
    return colorMatch ? colorMatch[1] : null
  }, [customEmbedCode])

  // ---------------------------------------------------------------------------
  // Real User Music & Offline Monero (XMR) Settlement (No Placeholders)
  // ---------------------------------------------------------------------------
  const defaultSellerXmr =
    multiChainAddresses?.MONERO ||
    '888tNkZrPN6JsEAnVsh4J7738fK8c9a3JdFZ1Q23xmrSellerNode9CivicReserve'

  // INITIAL STATE HAS ZERO PLACEHOLDER SONGS - PURGE ANY LEGACY PLACEHOLDERS
  const [mySongs, setMySongs] = useState<UserSong[]>(() => {
    try {
      const saved = localStorage.getItem('civicverse:my_music')
      if (saved) {
        const parsed: UserSong[] = JSON.parse(saved)
        // Purge any legacy placeholder tracks
        const filtered = parsed.filter(
          s => s.id !== 'song_1' && !s.title?.toLowerCase().includes('neo tokyo')
        )
        if (filtered.length !== parsed.length) {
          localStorage.setItem('civicverse:my_music', JSON.stringify(filtered))
        }
        return filtered
      }
    } catch {}
    return []
  })

  // Music Hub Navigation: 'uploaded' | 'bought' | 'rented'
  const [musicTab, setMusicTab] = useState<'uploaded' | 'bought' | 'rented'>('uploaded')

  // Bought Music State
  const [boughtSongs, setBoughtSongs] = useState<BoughtSong[]>(() => {
    try {
      const saved = localStorage.getItem('civicverse:bought_music')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })

  // Rented Music State
  const [rentedSongs, setRentedSongs] = useState<RentedSong[]>(() => {
    try {
      const saved = localStorage.getItem('civicverse:rented_music')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })

  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null)
  const [isPlayingSong, setIsPlayingSong] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Add Song Modal & Real File Upload
  const [showAddSongModal, setShowAddSongModal] = useState(false)
  const [newSongTitle, setNewSongTitle] = useState('')
  const [newSongArtist, setNewSongArtist] = useState(user.username)
  const [newSongUrl, setNewSongUrl] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [newSongPriceRights, setNewSongPriceRights] = useState(0.0065) // ~$1.00/mo
  const [newSongPriceOutright, setNewSongPriceOutright] = useState(0.0774) // ~$12.00 outright
  const [newSongBroadcast, setNewSongBroadcast] = useState(true)

  // Offline XMR Purchase Modal & Breakdown
  const [checkoutData, setCheckoutData] = useState<{
    song: UserSong
    type: 'rights' | 'outright'
    amount: number
    fiatAmount: string
    sellerAddress: string
  } | null>(null)
  const [copiedSellerAddress, setCopiedSellerAddress] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState('')

  // ---------------------------------------------------------------------------
  // Real Friends State (No fake placeholders)
  // ---------------------------------------------------------------------------
  const [friends, setFriends] = useState<UserFriend[]>(() => {
    try {
      const saved = localStorage.getItem('civicverse:my_friends')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })

  // Add Friend Modal
  const [showAddFriendModal, setShowAddFriendModal] = useState(false)
  const [newFriendUsername, setNewFriendUsername] = useState('')
  const [newFriendCivicId, setNewFriendCivicId] = useState('')

  // ---------------------------------------------------------------------------
  // Real Uploaded Videos & Broadcast Pipelines (CivicWatch & Billboards)
  // ---------------------------------------------------------------------------
  const [myVideos, setMyVideos] = useState<UserVideo[]>(() => {
    return getUserBroadcastVideos()
  })

  // Add Video Modal State
  const [showAddVideoModal, setShowAddVideoModal] = useState(false)
  const [newVideoTitle, setNewVideoTitle] = useState('')
  const [newVideoDesc, setNewVideoDesc] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [uploadedVideoFileName, setUploadedVideoFileName] = useState('')
  const [newVideoCivicWatch, setNewVideoCivicWatch] = useState(true)
  const [newVideoBillboards, setNewVideoBillboards] = useState(true)

  // Video Settings / Broadcast Menu Modal
  const [settingsVideo, setSettingsVideo] = useState<UserVideo | null>(null)
  const [editVideoTitle, setEditVideoTitle] = useState('')
  const [editVideoDesc, setEditVideoDesc] = useState('')
  const [editVideoCivicWatch, setEditVideoCivicWatch] = useState(true)
  const [editVideoBillboards, setEditVideoBillboards] = useState(true)

  // Video Playback Modal
  const [playingVideo, setPlayingVideo] = useState<UserVideo | null>(null)

  // ---------------------------------------------------------------------------
  // Vault Settings: Public Sharing & Foyer FM Broadcast Control
  // ---------------------------------------------------------------------------
  const [globalSharing, setGlobalSharing] = useState<boolean>(() => isGlobalSharingEnabled())
  const [foyerFmSharing, setFoyerFmSharing] = useState<boolean>(() => isFoyerFmSharingEnabled())
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false)
  const [showSettingsDropdown, setShowSettingsDropdown] = useState<boolean>(false)

  const handleToggleGlobalSharing = (targetState?: boolean) => {
    const next = targetState !== undefined ? targetState : !globalSharing
    setGlobalSharing(next)
    setGlobalSharingEnabled(next)
  }

  const handleToggleFoyerFmSharing = (targetState?: boolean) => {
    const next = targetState !== undefined ? targetState : !foyerFmSharing
    setFoyerFmSharing(next)
    setFoyerFmSharingEnabled(next)
    if (!next) {
      setMySongs(prev => prev.map(s => ({ ...s, isBroadcast: false })))
    } else {
      if (mySongs.length > 0 && !mySongs.some(s => s.isBroadcast)) {
        setMySongs(prev => prev.map((s, idx) => (idx === 0 ? { ...s, isBroadcast: true } : s)))
      }
    }
  }

  // Sync videos to localStorage and broadcast pipelines (CivicWatch & Billboards)
  useEffect(() => {
    try {
      setUserBroadcastVideos(myVideos)
    } catch (err) {
      console.warn('[Vault] Could not persist videos to storage:', err)
    }
  }, [myVideos])

  // Sync active broadcast to Foyer FM
  useEffect(() => {
    if (!foyerFmSharing) {
      setFoyerBroadcast(null)
      return
    }
    const broadcastSong = mySongs.find(s => s.isBroadcast)
    if (broadcastSong) {
      const track: FoyerBroadcastTrack = {
        id: broadcastSong.id,
        title: broadcastSong.title,
        artist: broadcastSong.artist || user.username,
        url: broadcastSong.url,
        creatorUsername: user.username,
        creatorCivicId: user.civicId,
        priceRights: broadcastSong.priceRights,
        priceOutright: broadcastSong.priceOutright,
        timestamp: Date.now()
      }
      setFoyerBroadcast(track)
    } else {
      setFoyerBroadcast(null)
    }
  }, [mySongs, foyerFmSharing, user.username, user.civicId])

  // Save songs to localStorage
  useEffect(() => {
    localStorage.setItem('civicverse:my_music', JSON.stringify(mySongs))
  }, [mySongs])

  // Save bought songs to localStorage
  useEffect(() => {
    localStorage.setItem('civicverse:bought_music', JSON.stringify(boughtSongs))
  }, [boughtSongs])

  // Save rented songs to localStorage
  useEffect(() => {
    localStorage.setItem('civicverse:rented_music', JSON.stringify(rentedSongs))
  }, [rentedSongs])

  // Save friends to localStorage
  useEffect(() => {
    localStorage.setItem('civicverse:my_friends', JSON.stringify(friends))
  }, [friends])

  // Close PoP dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popDropdownRef.current && !popDropdownRef.current.contains(event.target as Node)) {
        setShowPopDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Universal Audio play/pause handler (works for uploaded, bought, and rented music)
  const togglePlayTrack = (trackId: string, url: string) => {
    if (!audioRef.current || !url) return

    if (currentPlayingId === trackId && isPlayingSong) {
      audioRef.current.pause()
      setIsPlayingSong(false)
    } else {
      setCurrentPlayingId(trackId)
      audioRef.current.src = url
      audioRef.current
        .play()
        .then(() => {
          setIsPlayingSong(true)
        })
        .catch(err => {
          console.warn('Playback error:', err)
          setIsPlayingSong(false)
        })
    }
  }

  // Toggle sharing to Foyer FM
  const handleToggleBroadcast = (songId: string) => {
    setMySongs(prev =>
      prev.map(s => {
        if (s.id === songId) {
          const nextState = !s.isBroadcast
          return { ...s, isBroadcast: nextState }
        }
        return { ...s, isBroadcast: false }
      })
    )
  }

  // Real File Upload Handler (FileReader to Data URL for full offline playback)
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedFileName(file.name)
    if (!newSongTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      setNewSongTitle(cleanName)
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewSongUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle adding a new song
  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSongTitle.trim() || !newSongUrl.trim()) {
      alert('Please upload an audio file or provide a valid audio URL.')
      return
    }

    const newSong: UserSong = {
      id: 'song_' + Date.now(),
      title: newSongTitle.trim(),
      artist: newSongArtist.trim() || user.username,
      url: newSongUrl.trim(),
      priceRights: Number(newSongPriceRights) || 0.0065,
      priceOutright: Number(newSongPriceOutright) || 0.0774,
      isBroadcast: newSongBroadcast,
      sellerAddress: defaultSellerXmr
    }

    setMySongs(prev => {
      if (newSongBroadcast) {
        return [newSong, ...prev.map(s => ({ ...s, isBroadcast: false }))]
      }
      return [newSong, ...prev]
    })

    setNewSongTitle('')
    setNewSongUrl('')
    setUploadedFileName('')
    setShowAddSongModal(false)
  }

  const handleDeleteSong = (songId: string) => {
    setMySongs(prev => prev.filter(s => s.id !== songId))
    if (isPlayingSong && currentPlayingId === songId && audioRef.current) {
      audioRef.current.pause()
      setIsPlayingSong(false)
      setCurrentPlayingId(null)
    }
  }

  const handleDeleteBoughtSong = (songId: string) => {
    setBoughtSongs(prev => prev.filter(s => s.id !== songId))
    if (isPlayingSong && currentPlayingId === songId && audioRef.current) {
      audioRef.current.pause()
      setIsPlayingSong(false)
      setCurrentPlayingId(null)
    }
  }

  const handleDeleteRentedSong = (songId: string) => {
    setRentedSongs(prev => prev.filter(s => s.id !== songId))
    if (isPlayingSong && currentPlayingId === songId && audioRef.current) {
      audioRef.current.pause()
      setIsPlayingSong(false)
      setCurrentPlayingId(null)
    }
  }

  // Toggle Auto-Renew for Creator Rented Music
  const toggleAutoRenew = (songId: string) => {
    setRentedSongs(prev =>
      prev.map(r => (r.id === songId ? { ...r, autoRenew: !r.autoRenew } : r))
    )
  }

  // Open XMR Checkout with fixed fiat reflection: $1.00/mo rights, $12.00 outright
  const openXmrCheckout = (song: UserSong, type: 'rights' | 'outright') => {
    const amount = type === 'rights' ? (song.priceRights || 0.0065) : (song.priceOutright || 0.0774)
    const fiatAmount = type === 'rights' ? '$1.00 / Month' : '$12.00 Outright'
    const sellerAddress = song.sellerAddress || defaultSellerXmr
    setCheckoutData({
      song,
      type,
      amount,
      fiatAmount,
      sellerAddress
    })
    setCopiedSellerAddress(false)
  }

  // Confirm XMR Sent offline
  const handleConfirmXmrSent = () => {
    if (!checkoutData) return
    const { song, type, amount, fiatAmount } = checkoutData
    const label = type === 'rights' ? 'Media Rights Rental' : 'Full Outright Ownership'

    const receipt = {
      id: 'xmr_rec_' + Date.now(),
      songId: song.id,
      title: song.title,
      artist: song.artist,
      type,
      amount,
      fiatAmount,
      sellerNet: Number((amount * 0.92).toFixed(4)),
      taxTreasuryCut: Number((amount * 0.07).toFixed(4)), // 7% USA Sales Tax
      communityTreasuryCut: Number((amount * 0.01).toFixed(4)), // 1% Protocol Micro-contribution
      sellerAddress: checkoutData.sellerAddress,
      date: new Date().toISOString()
    }

    try {
      const existing = JSON.parse(localStorage.getItem('civicverse:my_music_receipts') || '[]')
      localStorage.setItem('civicverse:my_music_receipts', JSON.stringify([receipt, ...existing]))
    } catch {}

    // Add into Bought or Rented Music tab immediately
    if (type === 'rights') {
      const oneMonth = 30 * 24 * 60 * 60 * 1000
      const now = Date.now()
      setRentedSongs(prev => {
        const existingIdx = prev.findIndex(r => r.id === song.id)
        if (existingIdx >= 0) {
          const currentExp = Math.max(prev[existingIdx].expiresAt, now)
          const updated = [...prev]
          updated[existingIdx] = {
            ...updated[existingIdx],
            expiresAt: currentExp + oneMonth,
            autoRenew: true
          }
          return updated
        }
        return [
          {
            id: song.id,
            title: song.title,
            artist: song.artist,
            url: song.url,
            rentedAt: now,
            expiresAt: now + oneMonth,
            autoRenew: true,
            priceRights: amount,
            sellerAddress: checkoutData.sellerAddress,
            license: 'Media Rights Rental (1 Month)'
          },
          ...prev
        ]
      })
      setMusicTab('rented')
    } else {
      setBoughtSongs(prev => [
        {
          id: song.id,
          title: song.title,
          artist: song.artist,
          url: song.url,
          purchasedAt: Date.now(),
          amountXmr: amount,
          sellerAddress: checkoutData.sellerAddress,
          license: 'Full Outright Ownership & Commercial License'
        },
        ...prev.filter(b => b.id !== song.id)
      ])
      setMusicTab('bought')
    }

    setPurchaseSuccess(
      `✓ Confirmed offline transfer of ${amount} XMR (${fiatAmount}) for "${song.title}" (${label})! ` +
        `Settled wallet-to-wallet: ${(amount * 0.92).toFixed(4)} XMR to creator, ${(amount * 0.07).toFixed(4)} XMR (7% USA Tax), and ${(amount * 0.01).toFixed(4)} XMR (1% Protocol Micro-contribution).`
    )
    setCheckoutData(null)
    setTimeout(() => setPurchaseSuccess(''), 8000)
  }

  // Handle adding a real friend
  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFriendUsername.trim()) {
      alert('Please enter a username.')
      return
    }

    const newFriend: UserFriend = {
      id: 'friend_' + Date.now(),
      username: newFriendUsername.trim(),
      civicId: newFriendCivicId.trim() || `did:civic:${newFriendUsername.trim().toLowerCase()}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newFriendUsername.trim())}`
    }

    setFriends(prev => [newFriend, ...prev])
    setNewFriendUsername('')
    setNewFriendCivicId('')
    setShowAddFriendModal(false)
  }

  const handleRemoveFriend = (friendId: string) => {
    setFriends(prev => prev.filter(f => f.id !== friendId))
  }

  // Handle saving embedded PimpMyProfile code & About Me
  const handleSaveEmbedCode = () => {
    setCustomEmbedCode(embedCodeDraft)
    localStorage.setItem('civicverse:myspace:embed_code', embedCodeDraft)
    setAboutMeSaveStatus('Layout saved!')
    setTimeout(() => setAboutMeSaveStatus(''), 4000)
  }

  // Real Video File Upload Handler (ObjectURL + Data URL for offline / local playback)
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedVideoFileName(file.name)
    if (!newVideoTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      setNewVideoTitle(cleanName)
    }

    // Instant local object URL for immediate playback & preview
    const blobUrl = URL.createObjectURL(file)
    setNewVideoUrl(blobUrl)

    // Also read as data URL if file size is reasonable (< 15MB) for persistent storage
    if (file.size < 15 * 1024 * 1024) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewVideoUrl(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle Add New Video
  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      alert('Please upload a video file or provide a valid video URL.')
      return
    }

    const newVid: UserVideo = {
      id: 'video_' + Date.now(),
      title: newVideoTitle.trim(),
      description: newVideoDesc.trim(),
      url: newVideoUrl.trim(),
      creatorUsername: user.username,
      creatorCivicId: user.civicId,
      uploadedAt: Date.now(),
      shareToCivicWatch: newVideoCivicWatch,
      shareToBillboards: newVideoBillboards
    }

    setMyVideos(prev => [newVid, ...prev])
    setNewVideoTitle('')
    setNewVideoDesc('')
    setNewVideoUrl('')
    setUploadedVideoFileName('')
    setShowAddVideoModal(false)
  }

  // Handle Delete Video
  const handleDeleteVideo = (videoId: string) => {
    setMyVideos(prev => prev.filter(v => v.id !== videoId))
    if (playingVideo?.id === videoId) setPlayingVideo(null)
    if (settingsVideo?.id === videoId) setSettingsVideo(null)
  }

  // Quick toggle CivicWatch broadcast
  const handleToggleCivicWatch = (videoId: string) => {
    setMyVideos(prev =>
      prev.map(v => (v.id === videoId ? { ...v, shareToCivicWatch: !v.shareToCivicWatch } : v))
    )
  }

  // Quick toggle Billboards broadcast
  const handleToggleBillboards = (videoId: string) => {
    setMyVideos(prev =>
      prev.map(v => (v.id === videoId ? { ...v, shareToBillboards: !v.shareToBillboards } : v))
    )
  }

  // Open Video Settings Menu
  const openVideoSettings = (vid: UserVideo) => {
    setSettingsVideo(vid)
    setEditVideoTitle(vid.title)
    setEditVideoDesc(vid.description || '')
    setEditVideoCivicWatch(vid.shareToCivicWatch)
    setEditVideoBillboards(vid.shareToBillboards)
  }

  // Save Video Settings Menu
  const handleSaveVideoSettings = (e: React.FormEvent) => {
    e.preventDefault()
    if (!settingsVideo) return
    setMyVideos(prev =>
      prev.map(v =>
        v.id === settingsVideo.id
          ? {
              ...v,
              title: editVideoTitle.trim() || v.title,
              description: editVideoDesc.trim(),
              shareToCivicWatch: editVideoCivicWatch,
              shareToBillboards: editVideoBillboards
            }
          : v
      )
    )
    setSettingsVideo(null)
  }

  // PoP verification handlers
  const startVerification = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setVerifCode(code)
    setVerifying(true)
    setVerifStep(1)
    setShowPopDropdown(false)

    if (user.attestationCount === 0) {
      updateUser({ attestationCount: 1 })
    }
  }

  const handleNextVerifStep = () => {
    if (verifStep === 1) {
      setVerifStep(2)
    } else if (verifStep === 2) {
      if (peerPassInput.length === 6) {
        setVerifError('')
        const nextCount = (user.attestationCount || 0) + 1

        if (nextCount >= 3) {
          updateUser({ attestationCount: 3, verificationLevel: 2 })
          setVerifStep(3)
        } else {
          updateUser({ attestationCount: nextCount })
          const newCode = Math.floor(100000 + Math.random() * 900000).toString()
          setVerifCode(newCode)
          setPeerPassInput('')
          setVerifStep(1)
        }
      } else {
        setVerifError('Please enter the 6-digit password from your peer.')
      }
    }
  }

  const handleExportBackup = async () => {
    try {
      const backupData = {
        version: '1.7',
        timestamp: Date.now(),
        did: user.civicId,
        username: user.username,
        aboutMe,
        customEmbedCode,
        songs: mySongs,
        friends
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Vault_Backup_${user.username}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Failed to generate backup: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const handleCopyUrl = () => {
    const url = window.location.origin + '/vault'
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  return (
    <div className={`relative min-h-screen ${hasCustomTheme ? 'bg-transparent' : 'bg-[#070b14]/30'} text-white font-sans pb-24 transition-colors duration-500`}>
      {/* Hidden audio element for universal track playback (uploaded, bought, rented) */}
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlayingSong(false)
          setCurrentPlayingId(null)
        }}
      />

      {/* Brushed Stainless Steel Official Custom Styles with Translucent Glass effect */}
      <style>{`
        .myspace-table-header {
          background: repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.035) 0px,
            rgba(255, 255, 255, 0.035) 1px,
            transparent 1px,
            transparent 2px
          ),
          linear-gradient(
            135deg,
            rgba(42, 51, 66, 0.72) 0%,
            rgba(56, 68, 87, 0.72) 25%,
            rgba(34, 42, 54, 0.72) 50%,
            rgba(60, 73, 92, 0.72) 75%,
            rgba(42, 51, 66, 0.72) 100%
          ) !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(62, 76, 98, 0.5);
          color: #e2e8f0;
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 8px 12px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.4);
        }
        .myspace-box {
          background: repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.02) 0px,
            rgba(255, 255, 255, 0.02) 1px,
            transparent 1px,
            transparent 2px
          ),
          linear-gradient(
            180deg,
            rgba(23, 29, 38, 0.62) 0%,
            rgba(16, 20, 27, 0.72) 100%
          ) !important;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(46, 59, 78, 0.55);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }
        .bg-stainless-steel-panel {
          background: repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.02) 0px,
            rgba(255, 255, 255, 0.02) 1px,
            transparent 1px,
            transparent 2px
          ),
          linear-gradient(
            180deg,
            rgba(26, 32, 42, 0.65) 0%,
            rgba(17, 21, 28, 0.75) 100%
          ) !important;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .bg-stainless-steel {
          background: repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.035) 0px,
            rgba(255, 255, 255, 0.035) 1px,
            transparent 1px,
            transparent 2px
          ),
          linear-gradient(
            135deg,
            rgba(38, 45, 58, 0.82) 0%,
            rgba(53, 62, 79, 0.82) 20%,
            rgba(34, 40, 52, 0.82) 40%,
            rgba(63, 73, 92, 0.82) 60%,
            rgba(36, 43, 55, 0.82) 80%,
            rgba(47, 55, 71, 0.82) 100%
          ) !important;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .myspace-box div[class*="bg-[#111620]"],
        .myspace-box div[class*="bg-[#151c27]"],
        .myspace-box div[class*="bg-[#0c1017]"],
        .myspace-box div[class*="bg-[#141b27]"],
        .myspace-box div[class*="bg-[#10151e]"],
        .myspace-box div[class*="bg-[#0d121a]"],
        .bg-stainless-steel-panel div[class*="bg-[#111620]"],
        .bg-stainless-steel-panel div[class*="bg-[#151c27]"],
        .bg-stainless-steel-panel div[class*="bg-[#0c1017]"],
        .bg-stainless-steel-panel div[class*="bg-[#141b27]"],
        .bg-stainless-steel-panel div[class*="bg-[#10151e]"],
        .bg-stainless-steel-panel div[class*="bg-[#0d121a]"] {
          background-color: rgba(17, 22, 32, 0.62) !important;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
      `}</style>

      {/* Dynamic Theme Background: Custom Theme transforms the page, otherwise Background GIF shines through */}
      {hasCustomTheme ? (
        <>
          {/* Custom Theme Background Layer: GIF is completely switched off */}
          {customBgUrl && (
            <div
              className="fixed inset-0 z-0 pointer-events-none transition-all duration-700"
              style={{
                backgroundImage: `url("${customBgUrl}")`,
                backgroundColor: customBgColor || '#0a0d14',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'repeat',
                backgroundAttachment: 'fixed'
              }}
            />
          )}
          {/* Subtle overlay so text remains legible over bright wallpapers */}
          <div className="fixed inset-0 z-0 pointer-events-none bg-black/25 backdrop-blur-[0.5px]" />
        </>
      ) : (
        <>
          {/* Atmospheric Background (Default GIF is visible & translucent through all panels when NO custom theme is active) */}
          <div
            className="fixed inset-0 z-0 pointer-events-none opacity-80 transition-opacity duration-700"
            style={{
              backgroundImage: 'url("./images/wallet-bg.gif")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-[#070b14]/40 via-black/10 to-[#070b14]/50" />
        </>
      )}

      {/* ========================================================================= */}
      {/* 1. BRUSHED STAINLESS STEEL CIVICVERSE HEADER & METAVERSE IDENTITY          */}
      {/* ========================================================================= */}
      <header className="relative z-40 bg-stainless-steel border-b border-stainless-steel text-white shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
        <div className="container mx-auto max-w-6xl px-3 py-1.5 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <img
                src={CIVICVERSE_LOGO}
                onError={e => {
                  ;(e.currentTarget as HTMLImageElement).src = './Civicverselogo.png'
                }}
                alt="CivicVerse"
                className="w-7 h-7 rounded-full object-cover border border-orange-500/60 shadow-[0_0_12px_rgba(255,107,0,0.6)]"
              />
              <span className="font-mono font-black text-sm tracking-wide text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]">
                civicverse.github.io
              </span>
              <span className="hidden sm:inline-block text-[10px] text-gray-300 font-normal italic pl-2.5 border-l border-[#4a5568]">
                A civilian owned and governed decentralized non custodial 3d social metaverse
              </span>
            </div>
          </div>

          {/* Centered citizen search */}
          <div className="contents">
            <div className="flex items-center justify-self-center bg-[#141b27]/90 border border-stainless-steel rounded px-2.5 py-1 md:col-start-2 md:row-start-1">
              <span className="text-gray-400 text-[11px] pr-2 font-mono">Search Citizens:</span>
              <input
                type="text"
                placeholder="Find username / DID..."
                className="bg-transparent border-none text-[11px] text-white focus:outline-none w-36 font-mono placeholder-gray-500"
              />
              <button className="bg-[#242d3a] hover:bg-[#323d4e] border border-cyan-400/40 text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded ml-1 transition">
                GO
              </button>
            </div>

            {/* Consolidated PoP Dropdown Menu */}
            <div className="relative justify-self-end md:col-start-3 md:row-start-1" ref={popDropdownRef}>
              <button
                onClick={() => setShowPopDropdown(!showPopDropdown)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-black uppercase tracking-wider border transition-all ${
                  user.verificationLevel === 2
                    ? 'bg-purple-950/80 border-purple-400 text-purple-300 shadow-[0_0_12px_rgba(191,0,255,0.4)]'
                    : 'bg-[#1b2330] hover:bg-[#232c3d] border-[#3e4c62] text-gray-200 shadow-md'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  PoP STATUS: {user.verificationLevel === 2 ? 'PURPLE CHECK ✓' : `STEP ${user.attestationCount || 1}/3`}
                </span>
                {showPopDropdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* PoP Dropdown Panel */}
              {showPopDropdown && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] sm:w-96 max-h-[calc(100vh-5rem)] overflow-y-auto overscroll-contain touch-pan-y bg-[#131923] border border-cyan-500/60 rounded-xl p-5 shadow-[0_15px_50px_rgba(0,0,0,0.85)] z-50 text-left animate-slide-up backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="text-neon-cyan w-4 h-4" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-neon-cyan">
                        Proof of Personhood (PoP)
                      </h4>
                    </div>
                    <span className="text-[9px] font-mono text-gray-400">1_HUMAN_=_1_ID</span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-300 mb-1.5">
                      <span>Physical Attestations:</span>
                      <span className={user.verificationLevel === 2 ? 'text-neon-purple' : 'text-neon-cyan'}>
                        {user.attestationCount || 0} of 3 Verified
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(i => {
                        const verified = user.attestationCount >= i
                        const isFinal = i === 3
                        return (
                          <div
                            key={i}
                            className={`flex-1 py-1.5 rounded text-center text-[10px] font-black border transition-all ${
                              verified
                                ? isFinal
                                  ? 'bg-purple-600/30 border-purple-400 text-purple-300'
                                  : 'bg-green-600/30 border-green-400 text-green-300'
                                : 'bg-black/50 border-white/10 text-gray-600'
                            }`}
                          >
                            {isFinal ? (verified ? 'PURPLE CHECK ✓' : 'STEP 3') : verified ? 'GREEN X ✓' : `STEP ${i}`}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 text-[10px] text-gray-300 mb-4 bg-black/40 p-3 rounded-lg border border-white/5">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-neon-cyan font-black">1.</span>
                      <span>Meet Person A physically to exchange a 6-digit challenge code.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-neon-cyan font-black">2.</span>
                      <span>Meet Person B to exchange the second peer handshake passcode.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-neon-purple font-black">3.</span>
                      <span>Complete attestation 3 to lock in permanent Purple Checkmark status.</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {user.verificationLevel === 2 ? (
                      <div className="w-full bg-purple-950/60 border border-purple-500/50 p-2.5 rounded-lg text-center">
                        <p className="text-[11px] font-black text-purple-300 flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4 text-purple-400" /> PURPLE CHECK IDENTITY ACTIVE
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={startVerification}
                        className="w-full bg-gradient-to-r from-neon-cyan to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black text-xs py-2.5 rounded-lg uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>{verifying ? 'VERIFYING...' : 'START PEER PoP HANDSHAKE'}</span>
                      </button>
                    )}

                    <div className="flex items-center justify-between text-[9px] text-gray-400 pt-1 font-mono">
                      <span>STATUS: READY</span>
                      <button
                        onClick={() => setShowPopDropdown(false)}
                        className="text-gray-400 hover:text-white underline"
                      >
                        Close Menu
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Navbar with Main Portals */}
        <nav className="bg-stainless-steel-panel border-t border-stainless-steel text-gray-200">
          <div className="container mx-auto max-w-6xl px-3 flex flex-wrap items-center justify-between gap-1 overflow-visible text-[11px] font-bold py-1.5 scrollbar-none">
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              <span className="text-cyan-400 font-black px-2.5 py-0.5 bg-[#141b27] border border-cyan-500/40 rounded">
                MY VAULT
              </span>
              <span className="text-gray-500">|</span>
              <button onClick={() => nav('/foyer')} className="hover:text-cyan-300 hover:underline px-2 py-0.5 transition">
                🌐 Gathering Grounds
              </button>
              <span className="text-gray-500">|</span>
              <button onClick={() => nav('/civicwatch')} className="hover:text-cyan-300 hover:underline px-2 py-0.5 transition">
                📋 CivicWatch
              </button>
              <span className="text-gray-500">|</span>
              <button onClick={() => nav('/governance')} className="hover:text-cyan-300 hover:underline px-2 py-0.5 transition">
                🏛️ Governance
              </button>
              <span className="text-gray-500">|</span>
              <button onClick={() => nav('/treasury')} className="hover:text-cyan-300 hover:underline px-2 py-0.5 transition">
                🏦 Treasury
              </button>
              <span className="text-gray-500">|</span>
              <button onClick={() => nav('/mining-pool')} className="hover:text-cyan-300 hover:underline px-2 py-0.5 transition">
                ⛏️ Mining Pool
              </button>
              <span className="text-gray-500">|</span>
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className={`hover:text-cyan-300 px-2.5 py-0.5 rounded transition flex items-center gap-1 font-bold ${
                    showSettingsDropdown
                      ? 'bg-cyan-500 text-black shadow'
                      : 'text-cyan-300 hover:bg-white/10'
                  }`}
                  title="Broadcast & Sharing Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showSettingsDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Feature */}
                {showSettingsDropdown && (
                  <div className="absolute right-0 sm:left-0 top-full mt-2 w-80 max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-5rem)] overflow-y-auto overscroll-contain touch-pan-y bg-stainless-steel-panel border-2 border-stainless-steel rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.85)] p-3.5 z-50 text-white animate-fade-in backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                      <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 text-cyan-400" /> Broadcast & Privacy
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSettingsDropdown(false)}
                        className="text-gray-400 hover:text-white text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3 mb-3">
                      {/* Master Public Media Sharing Toggle */}
                      <div className="bg-[#0e131b]/80 border border-[#2e3b4e] rounded-lg p-2.5 flex items-center justify-between gap-2.5">
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-white flex items-center gap-1">
                            <Share2 className="w-3 h-3 text-cyan-400" />
                            <span>Public Media Sharing</span>
                          </div>
                          <p className="text-[9px] text-gray-400 leading-tight">
                            Stream videos to CivicWatch HUD & buildings.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleGlobalSharing()}
                          className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition shrink-0 ${
                            globalSharing
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                              : 'bg-[#1e2736] hover:bg-[#2a374b] text-gray-300 border border-[#3e4f68]'
                          }`}
                        >
                          {globalSharing ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      {/* Music to Foyer FM Broadcast Toggle */}
                      <div className="bg-[#0e131b]/80 border border-[#2e3b4e] rounded-lg p-2.5 flex items-center justify-between gap-2.5">
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-white flex items-center gap-1">
                            <Radio className="w-3 h-3 text-orange-400" />
                            <span>Music to Foyer FM</span>
                          </div>
                          <p className="text-[9px] text-gray-400 leading-tight">
                            Broadcast vault music live on Foyer FM.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleFoyerFmSharing()}
                          className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition shrink-0 ${
                            foyerFmSharing
                              ? 'bg-orange-500 hover:bg-orange-400 text-black shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                              : 'bg-[#1e2736] hover:bg-[#2a374b] text-gray-300 border border-[#3e4f68]'
                          }`}
                        >
                          {foyerFmSharing ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>

                    {/* Status Pill Footer */}
                    <div className="text-[9px] font-mono text-gray-400 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span>CivicWatch: <strong className={globalSharing ? 'text-cyan-300' : 'text-gray-500'}>{globalSharing ? 'Active' : 'Muted'}</strong></span>
                      <span>Foyer FM: <strong className={foyerFmSharing && mySongs.some(s => s.isBroadcast) ? 'text-orange-300' : 'text-gray-500'}>{foyerFmSharing && mySongs.some(s => s.isBroadcast) ? 'On Air' : 'Private'}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-2 shrink-0 pl-3">
              <button
                onClick={() => {
                  logout()
                  nav('/signin')
                }}
                className="text-red-400 hover:underline font-mono text-[10px]"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Guest Mode Notice */}
      {isGuestMode && (
        <div className="container mx-auto max-w-6xl px-3 pt-3">
          <div className="p-3 bg-stainless-steel border border-cyan-500/40 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-lg">
            <div>
              <p className="text-xs font-black uppercase text-white tracking-wider">Preview Session</p>
              <p className="text-[10px] text-gray-300">You are editing your vault profile in preview mode.</p>
            </div>
            <button
              onClick={() => nav('/signup')}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs px-3 py-1.5 rounded-lg uppercase tracking-wider transition"
            >
              Mint Real CivicID
            </button>
          </div>
        </div>
      )}

      {/* Purchase Notification Banner */}
      {purchaseSuccess && (
        <div className="container mx-auto max-w-6xl px-3 pt-3">
          <div className="p-3 bg-emerald-950/80 border-2 border-emerald-400 rounded-xl text-emerald-300 text-xs font-bold text-center animate-bounce shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            {purchaseSuccess}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CLASSIC 2-COLUMN BRUSHED STAINLESS STEEL PROFILE LAYOUT                */}
      {/* ========================================================================= */}
      <main className="container mx-auto max-w-6xl px-3 pt-3 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT COLUMN: User Header, 3D AVATAR (ONLY Wardrobe link at bottom), Tools */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-5 space-y-4">
            {/* Player1 Header Box - Nice & Big with Sweet Typography */}
            <div className="myspace-box p-6 rounded-xl text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-orange-500/10 pointer-events-none" />
              <div className="relative z-10">
                <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-cyan-400 font-extrabold block mb-1">
                  CITIZEN VAULT
                </span>
                <h1 className="text-4xl sm:text-5xl font-black tracking-wider uppercase font-mono text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-white drop-shadow-[0_2px_15px_rgba(0,217,255,0.45)]">
                  {user.username}
                </h1>
              </div>
            </div>

            {/* 3D AVATAR DIRECTLY RENDERED (NO EXTRA EDIT AT TOP, NO EXPORT IN STRIP) */}
            <div className="myspace-box rounded-lg overflow-hidden border border-stainless-steel shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <div className="myspace-table-header flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  3D AVATAR RIG
                </span>
              </div>

              {/* 3D Character Canvas */}
              <div className="relative w-full h-80 bg-gradient-to-b from-[#161d28] via-[#0d121a] to-black">
                <CharacterViewer
                  config={
                    user.character || {
                      skinColor: '#e0ac69',
                      hairColor: '#4a3b2a',
                      shirtColor: '#00d9ff',
                      pantsColor: '#1a1a2e',
                      shoesColor: '#333333',
                      hairStyle: 'short',
                      accessory: 'none',
                      bodyType: 'athletic'
                    }
                  }
                  className="w-full h-full"
                  animate={true}
                />

                <div className="absolute bottom-2 right-2 bg-black/80 border border-purple-500/40 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-purple-300">
                  PoP: {user.attestationCount || 1}/3
                </div>
              </div>

              {/* Avatar sub-strip - SINGLE WARDROBE LINK, NO EXPORT HERE */}
              <div className="bg-[#141b26] border-t border-stainless-steel p-2.5 text-center text-xs">
                <button
                  onClick={() => nav('/wardrobe')}
                  className="text-cyan-400 hover:text-cyan-300 font-bold transition flex items-center justify-center gap-1.5 mx-auto"
                >
                  <span>Customize in Wardrobe</span>
                  <span>↗</span>
                </button>
              </div>
            </div>

            {/* CONTACTING BOX */}
            <div className="myspace-box rounded-lg overflow-hidden">
              <div className="myspace-table-header">Contacting {user.username}</div>
              <div className="p-3 bg-[#111620] grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => alert(`Direct message opened for ${user.username}`)}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-gray-200 transition text-left"
                >
                  <Send className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">Send Message</span>
                </button>
                <button
                  onClick={handleCopyUrl}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-gray-200 transition text-left"
                >
                  <Copy className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span className="truncate">Forward to Friend</span>
                </button>
                <button
                  onClick={() => setShowAddFriendModal(true)}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-gray-200 transition text-left"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Add to Friends</span>
                </button>
                <button
                  onClick={() => alert(`Added ${user.username} to Favorites!`)}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-gray-200 transition text-left"
                >
                  <Heart className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="truncate">Add to Favorites</span>
                </button>
                <button
                  onClick={() => alert(`Citizen blocked.`)}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-gray-200 transition text-left"
                >
                  <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">Block User</span>
                </button>
                <button
                  onClick={() => nav('/governance')}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-gray-200 transition text-left"
                >
                  <UserCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">Add to Guild</span>
                </button>
                <button
                  onClick={() => setShowPopDropdown(true)}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 text-gray-200 transition text-left"
                >
                  <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">Attest Peer (PoP)</span>
                </button>
              </div>
            </div>

            {/* URL BOX */}
            <div className="myspace-box rounded-lg p-3">
              <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Citizen Vault URL:</div>
              <div className="flex items-center gap-2 bg-[#0e131b] border border-[#2e3b4e] rounded p-2 text-xs font-mono">
                <span className="truncate text-cyan-300">https://civicverse.github.io/vault/{user.username}</span>
                <button
                  onClick={handleCopyUrl}
                  className="shrink-0 text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-white font-sans transition"
                >
                  {copiedUrl ? 'COPIED!' : 'COPY'}
                </button>
              </div>
            </div>

            {/* CITIZEN DETAILS TABLE */}
            <div className="myspace-box rounded-lg overflow-hidden">
              <div className="myspace-table-header">{user.username}'s Details</div>
              <div className="p-3 bg-[#111620] text-xs divide-y divide-[#2e3b4e] space-y-2">
                <div className="flex pt-1">
                  <span className="w-28 text-gray-400 font-bold shrink-0">Civic ID:</span>
                  <span className="text-gray-200 font-mono text-[10px] truncate">{user.civicId}</span>
                </div>
                <div className="flex pt-2">
                  <span className="w-28 text-gray-400 font-bold shrink-0">Verification:</span>
                  <span className={user.verificationLevel === 2 ? 'text-purple-300 font-bold' : 'text-emerald-400'}>
                    {user.verificationLevel === 2 ? 'Purple Check Verified' : `Level 1 (${user.attestationCount || 1}/3 PoP)`}
                  </span>
                </div>
                <div className="flex pt-2">
                  <span className="w-28 text-gray-400 font-bold shrink-0">Music Catalog:</span>
                  <span className="text-gray-200 font-bold">
                    {mySongs.length} Uploaded · {boughtSongs.length} Bought · {rentedSongs.length} Rented
                  </span>
                </div>
                <div className="flex pt-2">
                  <span className="w-28 text-gray-400 font-bold shrink-0">Foyer FM Status:</span>
                  {mySongs.length === 0 ? (
                    <span className="text-gray-400 italic">Upload a song to broadcast</span>
                  ) : (
                    <span className={mySongs.some(s => s.isBroadcast) ? 'text-orange-400 font-bold' : 'text-gray-400 font-bold'}>
                      {mySongs.some(s => s.isBroadcast) ? '● Broadcasting Live' : 'Offline'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* VAULT SECURITY & RECOVERY */}
            <div className="myspace-box rounded-lg p-4 space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center justify-between">
                <span>Vault Key Management</span>
                <Lock className="w-3.5 h-3.5" />
              </div>

              <button
                onClick={() => setShowSeed(!showSeed)}
                className="w-full bg-[#141b27] hover:bg-[#1a2334] border border-[#2e3b4e] rounded px-3 py-2 text-xs font-bold flex items-center justify-between transition"
              >
                <span>{showSeed ? 'HIDE RECOVERY PHRASE' : 'REVEAL RECOVERY PHRASE'}</span>
                {showSeed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>

              {showSeed && (
                <div className="bg-[#0b0f16] rounded p-3 border border-pink-500/30 font-mono text-[10px] grid grid-cols-3 gap-1.5 animate-fade-in">
                  {(tempMnemonic || 'SEED_KEY_ENCRYPTED_VAULT').split(' ').map((w, i) => (
                    <div key={i} className="text-cyan-400 truncate">
                      <span className="opacity-30">{i + 1}.</span> {w}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleExportBackup}
                className="w-full bg-[#141b27] hover:bg-[#1a2334] border border-[#2e3b4e] rounded px-3 py-2 text-xs font-bold flex items-center justify-between transition"
              >
                <span>EXPORT ENCRYPTED BACKUP (.JSON)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: Real Music, PimpMyProfile, Friends, Comments              */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-7 space-y-4">
            {/* REAL USER MUSIC & FOYER FM BROADCAST HUB */}
            <div className="myspace-box rounded-lg p-4 bg-stainless-steel-panel border border-stainless-steel">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-orange-400" />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {user.username}'s Music Hub & Foyer FM Broadcast
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Manage uploaded tracks, bought licenses, and active media rights rentals with auto-renew
                    </p>
                  </div>
                </div>
                {musicTab === 'uploaded' && (
                  <button
                    onClick={() => setShowAddSongModal(true)}
                    className="bg-[#2a3547] hover:bg-[#37455c] border border-cyan-400/50 text-cyan-200 text-xs font-black px-3 py-1.5 rounded flex items-center gap-1.5 transition shadow"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Song</span>
                  </button>
                )}
              </div>

              {/* THREE TABS: Uploaded Music | Bought Music | Rented Music */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4 overflow-x-auto">
                <button
                  onClick={() => setMusicTab('uploaded')}
                  className={`px-3 py-1.5 rounded-t text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                    musicTab === 'uploaded'
                      ? 'bg-stainless-steel text-white border-t border-l border-r border-stainless-steel shadow-[0_-2px_8px_rgba(0,0,0,0.5)]'
                      : 'bg-[#121824] text-gray-400 hover:text-white hover:bg-[#1a2334]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Your Uploaded Music</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950/80 text-cyan-300 font-mono ml-1">
                    {mySongs.length}
                  </span>
                </button>

                <button
                  onClick={() => setMusicTab('bought')}
                  className={`px-3 py-1.5 rounded-t text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                    musicTab === 'bought'
                      ? 'bg-stainless-steel text-white border-t border-l border-r border-stainless-steel shadow-[0_-2px_8px_rgba(0,0,0,0.5)]'
                      : 'bg-[#121824] text-gray-400 hover:text-white hover:bg-[#1a2334]'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bought Music</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/80 text-emerald-300 font-mono ml-1">
                    {boughtSongs.length}
                  </span>
                </button>

                <button
                  onClick={() => setMusicTab('rented')}
                  className={`px-3 py-1.5 rounded-t text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                    musicTab === 'rented'
                      ? 'bg-stainless-steel text-white border-t border-l border-r border-stainless-steel shadow-[0_-2px_8px_rgba(0,0,0,0.5)]'
                      : 'bg-[#121824] text-gray-400 hover:text-white hover:bg-[#1a2334]'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
                  <span>Rented Music</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-orange-950/80 text-orange-300 font-mono ml-1">
                    {rentedSongs.length}
                  </span>
                </button>
              </div>

              {/* TAB 1: UPLOADED MUSIC */}
              {musicTab === 'uploaded' && (
                <>
                  {mySongs.length === 0 ? (
                    <div className="text-center py-8 bg-[#0d121a] rounded-xl border border-dashed border-[#2e3b4e]">
                      <FileAudio className="w-10 h-10 text-cyan-400/60 mx-auto mb-2" />
                      <p className="text-sm text-gray-200 font-bold mb-1">No Music in Catalog Yet</p>
                      <p className="text-xs text-gray-400 mb-4 max-w-sm mx-auto">
                        Upload your real audio tracks (MP3/WAV/OGG) to play on your page, broadcast to Foyer FM, and license media rights.
                      </p>
                      <button
                        onClick={() => setShowAddSongModal(true)}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black px-5 py-2 rounded-lg uppercase tracking-wider transition shadow-md"
                      >
                        + Upload Your Real Music
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mySongs.map((song) => {
                        const isCurrent = currentPlayingId === song.id && isPlayingSong
                        return (
                          <div
                            key={song.id}
                            className={`p-3 rounded-lg border transition ${
                              isCurrent
                                ? 'bg-[#151c27] border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                : 'bg-[#10151e] border-[#2e3b4e] hover:border-[#3e4f68]'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  onClick={() => togglePlayTrack(song.id, song.url)}
                                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition ${
                                    isCurrent
                                      ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                                      : 'bg-[#2a3547] hover:bg-[#37455c] text-cyan-300 border border-cyan-400/40 shadow'
                                  }`}
                                >
                                  {isCurrent ? (
                                    <Pause className="w-4 h-4 fill-black" />
                                  ) : (
                                    <Play className="w-4 h-4 fill-cyan-300 ml-0.5" />
                                  )}
                                </button>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-black text-white truncate">{song.title}</h4>
                                  <p className="text-[10px] text-gray-400 truncate">By {song.artist}</p>
                                </div>
                              </div>

                              {/* Foyer FM Broadcast Toggle Badge */}
                              <button
                                onClick={() => handleToggleBroadcast(song.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition ${
                                  song.isBroadcast
                                    ? 'bg-orange-950/70 border border-orange-500/70 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                                    : 'bg-[#18212e] border border-[#323f54] text-gray-400 hover:text-white'
                                }`}
                                title="Toggle broadcasting this song on Foyer FM in Gathering Grounds"
                              >
                                <Radio className={`w-3.5 h-3.5 ${song.isBroadcast ? 'animate-pulse text-orange-400' : ''}`} />
                                <span>{song.isBroadcast ? '● LIVE ON FOYER FM' : 'BROADCAST TO FOYER FM'}</span>
                              </button>
                            </div>

                            {/* Buy Buttons Alone Represent Message */}
                            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#2a374a] text-[11px]">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() => openXmrCheckout(song, 'rights')}
                                  className="bg-[#1a2332] hover:bg-[#253247] border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Rent Media Rights ($1.00/mo · {song.priceRights || 0.0065} XMR)</span>
                                </button>
                                <button
                                  onClick={() => openXmrCheckout(song, 'outright')}
                                  className="bg-[#14261f] hover:bg-[#1e382d] border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow"
                                >
                                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Buy Outright ($12.00 · {song.priceOutright || 0.0774} XMR)</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteSong(song.id)}
                                  className="text-gray-500 hover:text-red-400 p-1.5 transition ml-1"
                                  title="Delete song"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: BOUGHT MUSIC (Permanent Outright Ownership) */}
              {musicTab === 'bought' && (
                <>
                  {boughtSongs.length === 0 ? (
                    <div className="text-center py-8 bg-[#0d121a] rounded-xl border border-dashed border-[#2e3b4e]">
                      <Coins className="w-10 h-10 text-emerald-400/60 mx-auto mb-2" />
                      <p className="text-sm text-gray-200 font-bold mb-1">No Bought Music Yet</p>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto">
                        Tracks you buy outright ($12.00 · 0.0774 XMR) appear here with permanent lifetime commercial media ownership and offline downloads.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {boughtSongs.map((song) => {
                        const isCurrent = currentPlayingId === song.id && isPlayingSong
                        return (
                          <div
                            key={song.id}
                            className={`p-3 rounded-lg border transition ${
                              isCurrent
                                ? 'bg-[#151c27] border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                : 'bg-[#10151e] border-[#2e3b4e] hover:border-[#3e4f68]'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  onClick={() => togglePlayTrack(song.id, song.url)}
                                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition ${
                                    isCurrent
                                      ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                                      : 'bg-[#2a3547] hover:bg-[#37455c] text-emerald-300 border border-emerald-400/40 shadow'
                                  }`}
                                >
                                  {isCurrent ? (
                                    <Pause className="w-4 h-4 fill-black" />
                                  ) : (
                                    <Play className="w-4 h-4 fill-emerald-300 ml-0.5" />
                                  )}
                                </button>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-black text-white truncate">{song.title}</h4>
                                  <p className="text-[10px] text-gray-400 truncate">By {song.artist}</p>
                                </div>
                              </div>

                              <span className="bg-emerald-950/80 border border-emerald-500/70 text-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 shadow">
                                <Shield className="w-3 h-3 text-emerald-400" />
                                <span>Permanent License Owned</span>
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2a374a] text-[11px]">
                              <span className="text-[10px] text-gray-400">
                                Purchased: {new Date(song.purchasedAt).toLocaleDateString()} · {song.amountXmr} XMR ($12.00)
                              </span>
                              <div className="flex items-center gap-2">
                                <a
                                  href={song.url}
                                  download={`${song.title.replace(/\s+/g, '_')}.mp3`}
                                  className="bg-[#1e293b] hover:bg-[#2b3a52] border border-cyan-400/40 text-cyan-300 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download Audio</span>
                                </a>
                                <button
                                  onClick={() => handleDeleteBoughtSong(song.id)}
                                  className="text-gray-500 hover:text-red-400 p-1.5 transition"
                                  title="Remove from library"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}

              {/* TAB 3: RENTED MUSIC (Media Rights, Expiration & Auto-Renew for Creators) */}
              {musicTab === 'rented' && (
                <>
                  {rentedSongs.length === 0 ? (
                    <div className="text-center py-8 bg-[#0d121a] rounded-xl border border-dashed border-[#2e3b4e]">
                      <ShoppingBag className="w-10 h-10 text-orange-400/60 mx-auto mb-2" />
                      <p className="text-sm text-gray-200 font-bold mb-1">No Rented Music Active</p>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto">
                        Tracks you license media rights for ($1.00/mo · 0.0065 XMR) appear here with expiration countdowns and creator auto-renewal controls.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rentedSongs.map((song) => {
                        const isCurrent = currentPlayingId === song.id && isPlayingSong
                        const diffMs = song.expiresAt - Date.now()
                        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                        const isExpired = diffMs <= 0
                        const expDateStr = new Date(song.expiresAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })

                        return (
                          <div
                            key={song.id}
                            className={`p-3 rounded-lg border transition ${
                              isCurrent
                                ? 'bg-[#151c27] border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                                : 'bg-[#10151e] border-[#2e3b4e] hover:border-[#3e4f68]'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  onClick={() => togglePlayTrack(song.id, song.url)}
                                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition ${
                                    isCurrent
                                      ? 'bg-orange-400 text-black shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                                      : 'bg-[#2a3547] hover:bg-[#37455c] text-orange-300 border border-orange-400/40 shadow'
                                  }`}
                                >
                                  {isCurrent ? (
                                    <Pause className="w-4 h-4 fill-black" />
                                  ) : (
                                    <Play className="w-4 h-4 fill-orange-300 ml-0.5" />
                                  )}
                                </button>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-black text-white truncate">{song.title}</h4>
                                  <p className="text-[10px] text-gray-400 truncate">By {song.artist}</p>
                                </div>
                              </div>

                              {/* Expiration & Auto-Renew Controls */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Expiration Badge */}
                                <div
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold border ${
                                    isExpired
                                      ? 'bg-red-950/70 border-red-500/70 text-red-300'
                                      : daysLeft <= 3
                                      ? 'bg-amber-950/70 border-amber-500/70 text-amber-300'
                                      : 'bg-cyan-950/70 border-cyan-500/70 text-cyan-300'
                                  }`}
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{isExpired ? `Expired (${expDateStr})` : `Expires in ${daysLeft}d (${expDateStr})`}</span>
                                </div>

                                {/* Creator Auto-Renew Toggle Button */}
                                <button
                                  onClick={() => toggleAutoRenew(song.id)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition border ${
                                    song.autoRenew
                                      ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                      : 'bg-[#18212e] border-[#323f54] text-gray-400 hover:text-white'
                                  }`}
                                  title="Toggle creator auto-renewal for this track"
                                >
                                  <RefreshCw
                                    className={`w-3.5 h-3.5 ${song.autoRenew ? 'animate-spin text-emerald-400' : 'text-gray-500'}`}
                                    style={{ animationDuration: '4s' }}
                                  />
                                  <span>Auto-Renew: {song.autoRenew ? 'ON' : 'OFF'}</span>
                                </button>
                              </div>
                            </div>

                            {/* Creator Utility & Extension Row */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2a374a] text-[11px]">
                              <span className="text-[10px] text-gray-400">
                                <strong className="text-gray-300">Creator Media License:</strong>{' '}
                                {song.autoRenew ? 'Auto-renews at 0.0065 XMR / month ($1.00/mo)' : 'Manual renewal required'}
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    openXmrCheckout(
                                      {
                                        id: song.id,
                                        title: song.title,
                                        artist: song.artist,
                                        url: song.url,
                                        priceRights: song.priceRights || 0.0065,
                                        priceOutright: 0.0774,
                                        isBroadcast: false,
                                        sellerAddress: song.sellerAddress
                                      },
                                      'rights'
                                    )
                                  }}
                                  className="bg-[#1a2332] hover:bg-[#253247] border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow"
                                >
                                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Extend 30 Days ($1.00 · 0.0065 XMR)</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteRentedSong(song.id)}
                                  className="text-gray-500 hover:text-red-400 p-1.5 transition"
                                  title="Cancel & remove rental"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ABOUT ME */}
            <div className="myspace-box rounded-lg overflow-hidden border border-stainless-steel">
              <div className="myspace-table-header flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span>{user.username}'s About Me</span>
                  {hasCustomTheme && <span className="rounded border border-purple-400 bg-purple-950 px-2 py-0.5 text-[9px] font-black text-purple-300">CUSTOM THEME</span>}
                </div>
                <div className="flex items-center gap-2">
                  <a href="https://www.pimp-my-profile.com/myspace-layouts/" target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 rounded border border-cyan-400/40 bg-[#18212e] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-200 hover:bg-[#222e40]">
                    <ExternalLink className="h-3 w-3" /> Open Pimp My Profile ↗
                  </a>
                  {!isEditingAboutMe && <button type="button" onClick={() => {
                    setAboutMeDraft(aboutMe || extractAboutMeText(customEmbedCode))
                    setEmbedCodeDraft(customEmbedCode)
                    setIsEditingAboutMe(true)
                  }} className="rounded bg-cyan-500 px-3 py-1 text-[10px] font-black uppercase text-black hover:bg-cyan-400">Edit</button>}
                </div>
              </div>

              {!isEditingAboutMe ? (
                <div className="min-h-20 bg-[#111620] p-4">
                  {visibleAboutMe ? <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-200">{visibleAboutMe}</p> : <p className="text-sm text-gray-500">Add a little about yourself.</p>}
                </div>
              ) : (
                <div className="space-y-4 bg-[#111620] p-4">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    About Me
                    <textarea rows={4} maxLength={1200} value={aboutMeDraft} onChange={event => setAboutMeDraft(event.target.value)}
                      placeholder="Write a few lines about yourself..." className="mt-2 w-full rounded-xl border border-[#2e3b4e] bg-[#0c1017] p-3 text-sm leading-relaxed text-white focus:border-cyan-400 focus:outline-none" />
                  </label>
                  <details className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <summary className="cursor-pointer text-xs font-bold text-cyan-200">MySpace layout code</summary>
                    <p className="my-2 text-[10px] text-gray-500">Paste or edit the layout code here. It stays hidden when you view your Vault.</p>
                    <textarea rows={8} value={embedCodeDraft} onChange={event => setEmbedCodeDraft(event.target.value)}
                      placeholder="Paste your layout code from Pimp My Profile..." className="w-full rounded-xl border border-[#2e3b4e] bg-[#0c1017] p-3 font-mono text-xs text-cyan-200 focus:border-cyan-400 focus:outline-none" />
                  </details>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2e3b4e] pt-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => {
                        setEmbedCodeDraft('')
                        setCustomEmbedCode('')
                        localStorage.removeItem('civicverse:myspace:embed_code')
                        setAboutMeSaveStatus('Layout cleared.')
                      }} className="flex items-center gap-1 text-xs font-bold text-red-400 underline hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /> Clear layout</button>
                      {aboutMeSaveStatus && <span className="text-xs font-bold text-emerald-400">{aboutMeSaveStatus}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setIsEditingAboutMe(false)} className="rounded px-4 py-2 text-xs font-bold text-gray-300 hover:bg-white/10">Cancel</button>
                      <button type="button" onClick={() => {
                        setAboutMe(aboutMeDraft.trim())
                        localStorage.setItem('civicverse:myspace:about_me', aboutMeDraft.trim())
                        handleSaveEmbedCode()
                        setIsEditingAboutMe(false)
                        setAboutMeSaveStatus('About Me saved.')
                      }} className="flex items-center gap-1.5 rounded bg-cyan-500 px-5 py-2 text-xs font-black uppercase text-black shadow hover:bg-cyan-400"><Check className="h-4 w-4" /> Save</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* REAL FRIENDS SECTION */}
            <div className="myspace-box rounded-lg overflow-hidden border border-stainless-steel">
              <div className="myspace-table-header flex items-center justify-between">
                <span>{user.username}'s Friends ({friends.length})</span>
                <button
                  onClick={() => setShowAddFriendModal(true)}
                  className="bg-[#242d3a] hover:bg-[#323d4e] border border-cyan-400/50 text-cyan-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-cyan-400" />
                  <span>Add Friend</span>
                </button>
              </div>

              <div className="p-4 bg-[#111620]">
                {friends.length === 0 ? (
                  <div className="text-center py-6 bg-black/40 rounded-lg border border-[#2e3b4e]">
                    <UserPlus className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-300 font-bold mb-1">No friends added yet.</p>
                    <p className="text-[10px] text-gray-400 mb-3">
                      Add your real friends by username or meet citizens live in the Gathering Grounds foyer.
                    </p>
                    <button
                      onClick={() => setShowAddFriendModal(true)}
                      className="bg-[#242d3a] hover:bg-[#323d4e] border border-cyan-400/50 text-cyan-300 text-xs font-black px-4 py-1.5 rounded uppercase transition"
                    >
                      + Add Friend
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {friends.map(f => (
                      <div
                        key={f.id}
                        className="group text-center bg-[#151c27] border border-[#2e3b4e] hover:border-cyan-400 rounded p-2.5 transition relative"
                      >
                        <button
                          onClick={() => handleRemoveFriend(f.id)}
                          className="absolute top-1 right-1 text-gray-500 hover:text-red-400 text-xs"
                          title="Remove friend"
                        >
                          ✕
                        </button>
                        <p className="text-[11px] font-bold text-white group-hover:text-cyan-300 truncate mb-1">
                          {f.username}
                        </p>
                        <div className="w-16 h-16 mx-auto rounded overflow-hidden border border-[#2e3b4e] mb-1.5 bg-[#0a0e14]">
                          <img
                            src={f.avatar}
                            alt={f.username}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[9px] text-gray-400 font-mono truncate">{f.civicId}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* UPLOADED VIDEOS SECTION (REPLACES COMMENT SECTION · PLAYS ON CIVICWATCH SCREENS & BUILDINGS) */}
            <div className="myspace-box rounded-lg overflow-hidden border border-stainless-steel">
              <div className="myspace-table-header flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-cyan-400" />
                  <span>{user.username}'s Uploaded Videos & CivicWatch Broadcast</span>
                  <span className="text-[9px] font-mono bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 px-2 py-0.5 rounded font-black uppercase">
                    HUD & Building Screens
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {!globalSharing ? (
                    <span className="inline-flex items-center gap-1 text-[9px] bg-red-950/80 border border-red-500/60 text-red-300 font-bold px-2 py-0.5 rounded shadow">
                      Sharing: OFF
                    </span>
                  ) : (
                    <>
                      {myVideos.some(v => v.shareToCivicWatch) && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[9px] bg-cyan-950/80 border border-cyan-400 text-cyan-300 font-bold px-2 py-0.5 rounded shadow">
                          <Tv className="w-2.5 h-2.5" /> CivicWatch HUD Active
                        </span>
                      )}
                      {myVideos.some(v => v.shareToBillboards) && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[9px] bg-purple-950/80 border border-purple-400 text-purple-300 font-bold px-2 py-0.5 rounded shadow">
                          <Monitor className="w-2.5 h-2.5" /> Building Billboards Active
                        </span>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => setShowAddVideoModal(true)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-black px-3 py-1 rounded uppercase tracking-wider transition flex items-center gap-1 shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                    <span>Upload Video</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-[#111620]/70 backdrop-blur-sm">
                {myVideos.length === 0 ? (
                  <div className="text-center py-8 bg-black/40 rounded-lg border border-[#2e3b4e]">
                    <Video className="w-10 h-10 text-cyan-400/60 mx-auto mb-2" />
                    <p className="text-xs text-gray-200 font-bold mb-1">No videos uploaded yet.</p>
                    <button
                      onClick={() => setShowAddVideoModal(true)}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black px-5 py-2 rounded-xl uppercase tracking-wider transition shadow-md"
                    >
                      + Upload Your First Video
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myVideos.map(vid => {
                      const isBroadcastingCivicWatch = globalSharing && vid.shareToCivicWatch
                      const isBroadcastingBillboards = globalSharing && vid.shareToBillboards

                      return (
                        <div
                          key={vid.id}
                          className="bg-[#151c27]/70 border border-[#2e3b4e] rounded-xl overflow-hidden hover:border-cyan-400/60 transition group flex flex-col justify-between shadow-lg"
                        >
                          {/* Video Player Preview with click-to-expand */}
                          <div
                            className="relative bg-black aspect-video w-full flex items-center justify-center overflow-hidden cursor-pointer group/vid"
                            onClick={() => setPlayingVideo(vid)}
                            title="Click to expand player"
                          >
                            <video
                              src={vid.url}
                              className="w-full h-full object-contain pointer-events-none"
                              preload="metadata"
                            />
                            <div className="absolute inset-0 bg-black/30 group-hover/vid:bg-black/10 transition flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-cyan-500/90 text-black flex items-center justify-center shadow-lg transform group-hover/vid:scale-110 transition">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </div>
                            </div>

                            {/* Floating Active Badges */}
                            <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                              {isBroadcastingCivicWatch && (
                                <span className="bg-cyan-950/90 border border-cyan-400 text-cyan-300 text-[8.5px] font-black px-1.5 py-0.5 rounded shadow">
                                  HUD SCREEN
                                </span>
                              )}
                              {isBroadcastingBillboards && (
                                <span className="bg-purple-950/90 border border-purple-400 text-purple-300 text-[8.5px] font-black px-1.5 py-0.5 rounded shadow">
                                  BUILDINGS
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Video Details & Broadcast Controls */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <h4
                                  onClick={() => setPlayingVideo(vid)}
                                  className="text-xs font-black text-white group-hover:text-cyan-300 transition line-clamp-1 cursor-pointer"
                                >
                                  {vid.title}
                                </h4>
                                <button
                                  onClick={() => openVideoSettings(vid)}
                                  className="text-gray-400 hover:text-cyan-300 p-1 rounded transition shrink-0"
                                  title="Open broadcast options & settings menu"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {vid.description && (
                                <p className="text-[10px] text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                                  {vid.description}
                                </p>
                              )}
                            </div>

                            {/* Broadcast Pipeline Toggles */}
                            <div className="pt-2 border-t border-[#2e3b4e]/80 space-y-2 mt-2">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                {/* CivicWatch Hub Toggle */}
                                <button
                                  onClick={() => handleToggleCivicWatch(vid.id)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider border transition ${
                                    vid.shareToCivicWatch
                                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,217,255,0.3)]'
                                      : 'bg-[#10151f] border-[#2e3b4e] text-gray-500 hover:text-gray-300'
                                  }`}
                                  title="Toggle broadcast to CivicWatch video tab in Media Hub"
                                >
                                  <Tv className="w-3 h-3" />
                                  <span>CivicWatch HUD: {vid.shareToCivicWatch ? 'ON' : 'OFF'}</span>
                                </button>

                                {/* City Billboards Toggle */}
                                <button
                                  onClick={() => handleToggleBillboards(vid.id)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider border transition ${
                                    vid.shareToBillboards
                                      ? 'bg-purple-950/80 border-purple-400 text-purple-300 shadow-[0_0_8px_rgba(191,0,255,0.3)]'
                                      : 'bg-[#10151f] border-[#2e3b4e] text-gray-500 hover:text-gray-300'
                                  }`}
                                  title="Toggle broadcast to in-game 3D city screens and billboards"
                                >
                                  <Monitor className="w-3 h-3" />
                                  <span>Buildings: {vid.shareToBillboards ? 'ON' : 'OFF'}</span>
                                </button>

                                {/* Delete button */}
                                <button
                                  onClick={() => handleDeleteVideo(vid.id)}
                                  className="text-gray-500 hover:text-red-400 p-1 transition ml-auto"
                                  title="Delete video"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: UPLOAD REAL AUDIO FILE / BROADCAST TO FOYER FM */}
      {/* ========================================================================= */}
      {showAddSongModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="max-w-md w-full bg-stainless-steel-panel border-2 border-stainless-steel rounded-2xl p-6 relative shadow-[0_15px_50px_rgba(0,0,0,0.8)]">
            <button
              onClick={() => setShowAddSongModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-lg font-black uppercase tracking-tight mb-1 text-white flex items-center gap-2">
              <Upload className="text-cyan-400 w-5 h-5" /> Upload Audio Track
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Upload your real music file to play in your vault and broadcast live to Foyer FM.
            </p>

            <form onSubmit={handleAddSong} className="space-y-3">
              {/* File Upload Selector */}
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                  Select Audio File (MP3, WAV, OGG, FLAC)
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileUpload}
                  className="w-full bg-[#0c1017] border border-[#2e3b4e] rounded px-3 py-2 text-xs text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-black file:bg-cyan-500 file:text-black hover:file:bg-cyan-400 cursor-pointer"
                />
                {uploadedFileName && (
                  <p className="text-[10px] text-cyan-300 font-mono mt-1 truncate">
                    Loaded: {uploadedFileName}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">Track Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midnight Mesh Runner"
                  value={newSongTitle}
                  onChange={e => setNewSongTitle(e.target.value)}
                  className="w-full bg-[#0c1017] border border-[#2e3b4e] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">Artist Name</label>
                <input
                  type="text"
                  value={newSongArtist}
                  onChange={e => setNewSongArtist(e.target.value)}
                  className="w-full bg-[#0c1017] border border-[#2e3b4e] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* URL input (optional if file loaded) */}
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                  Audio Stream / Direct URL (or Uploaded File Source)
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://... or loaded from audio file"
                  value={newSongUrl}
                  onChange={e => setNewSongUrl(e.target.value)}
                  className="w-full bg-[#0c1017] border border-[#2e3b4e] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                    Rent Rights ($1.00/mo)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={newSongPriceRights}
                    onChange={e => setNewSongPriceRights(Number(e.target.value))}
                    className="w-full bg-[#0c1017] border border-[#2e3b4e] rounded px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[9px] text-gray-400 font-mono mt-0.5 block">≈ 0.0065 XMR</span>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                    Buy Outright ($12.00)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={newSongPriceOutright}
                    onChange={e => setNewSongPriceOutright(Number(e.target.value))}
                    className="w-full bg-[#0c1017] border border-[#2e3b4e] rounded px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[9px] text-gray-400 font-mono mt-0.5 block">≈ 0.0774 XMR</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="broadcastCheck"
                  checked={newSongBroadcast}
                  onChange={e => setNewSongBroadcast(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-500 focus:ring-0 bg-black border-[#2e3b4e]"
                />
                <label htmlFor="broadcastCheck" className="text-xs text-orange-200 font-bold cursor-pointer">
                  Broadcast this track to the Foyer FM channel in Gathering Grounds
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSongModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs px-5 py-2 rounded uppercase tracking-wider transition"
                >
                  Save & Add Song
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: OFFLINE WALLET-TO-WALLET MONERO (XMR) SETTLEMENT                 */}
      {/* USA 7% TAX + 1% COMMUNITY PROTOCOL MICRO-CONTRIBUTION (CIVICVERSE 0%)     */}
      {/* ========================================================================= */}
      {checkoutData && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="max-w-lg w-full bg-stainless-steel-panel border-2 border-stainless-steel rounded-2xl p-6 relative shadow-[0_20px_70px_rgba(0,0,0,0.9)] text-white">
            <button
              onClick={() => setCheckoutData(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <Coins className="w-5 h-5 text-orange-400" />
              <h3 className="text-base font-black uppercase tracking-wider text-white">
                Wallet-to-Wallet Monero Settlement
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 mb-4">
              Peer-to-peer settlement offline on the Monero blockchain.
            </p>

            <div className="bg-[#0c1017] border border-[#2e3b4e] rounded-xl p-3.5 space-y-2 mb-4 text-xs font-sans">
              <div className="flex justify-between">
                <span className="text-gray-400">Track:</span>
                <span className="font-bold text-white truncate max-w-[240px]">
                  {checkoutData.song.title} — {checkoutData.song.artist}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">License Option:</span>
                <span className="font-bold text-cyan-400">
                  {checkoutData.type === 'rights' ? 'Renting Media Rights (1 Month · $1.00)' : 'Buy Outright (Permanent License · $12.00)'}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#2e3b4e] pt-2 text-sm">
                <span className="font-bold text-gray-300">Total Monero to Send:</span>
                <div className="text-right">
                  <span className="font-mono font-black text-orange-400 text-base block">
                    {checkoutData.amount} XMR
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">({checkoutData.fiatAmount})</span>
                </div>
              </div>
            </div>

            {/* Seller Monero Wallet Send Address */}
            <div className="mb-4">
              <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                Seller Monero (XMR) Send Address:
              </label>
              <div className="bg-[#090d14] border border-[#2e3b4e] rounded-xl p-3 flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-cyan-300 break-all select-all">
                  {checkoutData.sellerAddress}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(checkoutData.sellerAddress)
                    setCopiedSellerAddress(true)
                    setTimeout(() => setCopiedSellerAddress(false), 2000)
                  }}
                  className="bg-[#242d3a] hover:bg-[#323d4e] border border-cyan-400/40 text-cyan-300 text-[10px] font-bold px-3 py-1 rounded shrink-0 transition"
                >
                  {copiedSellerAddress ? 'COPIED!' : 'COPY'}
                </button>
              </div>
            </div>

            {/* Automated Accounting: 92% Seller, 7% USA Tax, 1% Community Treasury (Civicverse Cut = 0) */}
            <div className="bg-[#090d14] border border-[#2e3b4e] rounded-xl p-3.5 mb-4 space-y-2 text-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-[#2e3b4e] pb-1">
                Wallet-to-Wallet Direct Distribution
              </p>
              <div className="flex justify-between text-gray-300">
                <span>Direct to Seller (92%):</span>
                <span className="font-mono font-bold text-white">
                  {(checkoutData.amount * 0.92).toFixed(4)} XMR
                </span>
              </div>
              <div className="flex justify-between text-purple-400">
                <span className="flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5" /> USA Sales Tax Collection (7% Tax):
                </span>
                <span className="font-mono font-bold">
                  +{(checkoutData.amount * 0.07).toFixed(4)} XMR
                </span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Community Treasury (1% Micro-contribution):
                </span>
                <span className="font-mono font-bold">
                  +{(checkoutData.amount * 0.01).toFixed(4)} XMR
                </span>
              </div>
              <div className="flex justify-between text-gray-500 pt-1 border-t border-[#2e3b4e]/50 font-mono text-[10px]">
                <span>Civicverse Platform Fee:</span>
                <span className="font-bold text-gray-400">0.00 XMR (0% Cut)</span>
              </div>
            </div>

            {/* Terms of Service Peer-to-Peer Notice */}
            <div className="bg-[#121926] border border-[#2e3b4e] rounded-xl p-3 mb-5 text-[10px] text-gray-400 leading-relaxed">
              <strong className="text-gray-200">⚖️ Peer-to-Peer Protocol Guarantee:</strong> Everything is wallet-to-wallet only. The Civicverse platform collects nothing nor takes a cut. Everything is voluntary by the TOS—you do not pay Civicverse directly; you pay each other and the community treasury directly.
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCheckoutData(null)}
                className="flex-1 py-2.5 bg-[#18212e] hover:bg-[#222d3e] border border-[#323f54] text-xs font-bold uppercase rounded-xl transition text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmXmrSent}
                className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-black text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg"
              >
                Confirm XMR Sent From Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD REAL FRIEND */}
      {/* ========================================================================= */}
      {showAddFriendModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="max-w-md w-full bg-stainless-steel-panel border-2 border-stainless-steel rounded-2xl p-6 relative shadow-[0_15px_50px_rgba(0,0,0,0.8)]">
            <button
              onClick={() => setShowAddFriendModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-lg font-black uppercase tracking-tight mb-1 text-white flex items-center gap-2">
              <UserPlus className="text-cyan-400 w-5 h-5" /> Add Real Friend
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Add a friend by their username or CivicID to pin them to your friends space.
            </p>

            <form onSubmit={handleAddFriend} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">Friend Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={newFriendUsername}
                  onChange={e => setNewFriendUsername(e.target.value)}
                  className="w-full bg-[#0c1017] border border-[#2e3b4e] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">CivicID (Optional)</label>
                <input
                  type="text"
                  placeholder="did:civic:..."
                  value={newFriendCivicId}
                  onChange={e => setNewFriendCivicId(e.target.value)}
                  className="w-full bg-[#0c1017] border border-[#2e3b4e] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddFriendModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs px-5 py-2 rounded uppercase tracking-wider transition"
                >
                  Add Friend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: PoP HANDSHAKE VERIFICATION MODAL */}
      {/* ========================================================================= */}
      {verifying && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="max-w-md w-full bg-stainless-steel-panel border-2 border-stainless-steel rounded-2xl p-6 text-center relative shadow-[0_15px_50px_rgba(0,0,0,0.8)]">
            <button
              onClick={() => {
                setVerifying(false)
                setVerifStep(1)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              ✕
            </button>

            {verifStep === 1 && (
              <div className="animate-fade-in">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-[#141d2a] rounded-2xl flex items-center justify-center border border-cyan-500/40">
                    <QrCode className="w-8 h-8 text-cyan-400" />
                  </div>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight mb-1 text-white">
                  Proof of Personhood Challenge
                </h3>
                <p className="text-xs text-gray-400 mb-6 uppercase font-bold tracking-tight">
                  {user.attestationCount === 0
                    ? 'Meet Verified Person A'
                    : user.attestationCount === 1
                    ? 'Meet Verified Person B'
                    : 'Meet Verified Person C'}
                </p>

                <div className="bg-[#090d14] border-2 border-dashed border-cyan-500/60 rounded-xl p-6 mb-6">
                  <div className="text-4xl font-mono font-black tracking-[0.25em] text-cyan-400 mb-1">
                    {verifCode}
                  </div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400">
                    6-Digit Challenge Code
                  </p>
                </div>

                <button
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs py-3 rounded-xl uppercase tracking-wider transition shadow-md"
                  onClick={handleNextVerifStep}
                >
                  I've Shared My Code with Peer →
                </button>
              </div>
            )}

            {verifStep === 2 && (
              <div className="animate-fade-in">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-purple-950/40 rounded-2xl flex items-center justify-center border border-purple-500/40 text-purple-400">
                    <UserPlus className="w-8 h-8" />
                  </div>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight mb-1 text-white">
                  Peer Handshake Passcode
                </h3>
                <p className="text-xs text-gray-400 mb-6 uppercase font-bold tracking-tight">
                  Enter the 6-digit passcode provided by your physical peer.
                </p>

                <div className="space-y-3 mb-6">
                  <input
                    type="text"
                    maxLength={6}
                    className="w-full bg-[#090d14] border-2 border-purple-500/60 rounded-xl p-4 text-center text-3xl font-mono font-black tracking-[0.25em] text-purple-300 outline-none focus:border-purple-400 transition"
                    placeholder="000000"
                    value={peerPassInput}
                    onChange={e => setPeerPassInput(e.target.value.replace(/\D/g, ''))}
                  />
                  {verifError && (
                    <p className="text-pink-400 text-[10px] font-bold uppercase animate-pulse">
                      {verifError}
                    </p>
                  )}
                </div>

                <button
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider transition shadow-md"
                  onClick={handleNextVerifStep}
                >
                  {user.attestationCount < 2 ? 'Submit Attestation' : 'Finalize Purple Check PoP'}
                </button>
              </div>
            )}

            {verifStep === 3 && (
              <div className="animate-fade-in">
                <div className="mb-4 flex justify-center">
                  <div className="w-20 h-20 bg-purple-950/40 rounded-full flex items-center justify-center border-4 border-purple-400 shadow-[0_0_30px_rgba(191,0,255,0.4)] animate-bounce">
                    <Check className="w-10 h-10 text-purple-300 stroke-[4px]" />
                  </div>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-purple-300">
                  Proof of Personhood Secured
                </h3>
                <div className="flex justify-center gap-2 mb-4 text-[10px] font-black">
                  <span className="text-emerald-400">GREEN X 1/3 ✓</span>
                  <span className="text-emerald-400">GREEN X 2/3 ✓</span>
                  <span className="text-purple-300">PURPLE CHECK ✓</span>
                </div>
                <p className="text-xs text-gray-300 mb-6 leading-relaxed">
                  Congratulations! You have completed all 3 physical peer attestations. Your ID is verified.
                </p>

                <button
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider transition shadow-md"
                  onClick={() => {
                    setVerifying(false)
                    setVerifStep(1)
                  }}
                >
                  Return to Vault
                </button>
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 bg-white/5 border border-white/10 p-3 rounded-lg text-left">
              <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
              <p className="text-[9px] text-gray-400 font-medium uppercase leading-relaxed">
                PoP requires real-world physical presence. Never share codes over public digital channels.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: UPLOAD VIDEO MODAL (CIVICWATCH & BUILDING SCREENS)               */}
      {/* ========================================================================= */}
      {showAddVideoModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="max-w-lg w-full bg-stainless-steel-panel border-2 border-stainless-steel rounded-2xl p-6 relative shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-white">
            <button
              onClick={() => setShowAddVideoModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Film className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-black uppercase tracking-tight text-white">
                Upload Video to CivicWatch
              </h3>
            </div>
            <p className="text-xs text-gray-300 mb-4">
              Upload your video file or provide a video stream to broadcast live on the game's{' '}
              <strong className="text-cyan-300">CivicWatch screens (HUD ▶ VIDEOS)</strong> and{' '}
              <strong className="text-purple-300">3D building jumbotrons</strong>.
            </p>

            <form onSubmit={handleAddVideo} className="space-y-3.5">
              {/* File Selector */}
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                  Select Video File (MP4, WebM, OGG, MOV)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileUpload}
                  className="w-full bg-[#0c1017] border border-[#2e3b4e] rounded px-3 py-2 text-xs text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-black file:bg-cyan-500 file:text-black hover:file:bg-cyan-400 cursor-pointer"
                />
                {uploadedVideoFileName && (
                  <p className="text-[10px] text-cyan-300 font-mono mt-1 truncate">
                    Loaded: {uploadedVideoFileName}
                  </p>
                )}
              </div>

              {/* Title input */}
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">Video Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gathering Grounds Rooftop Patrol"
                  value={newVideoTitle}
                  onChange={e => setNewVideoTitle(e.target.value)}
                  className="w-full bg-[#0c1017] border border-[#2e3b4e] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Description input */}
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">Description / Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Brief report or commentary on this footage..."
                  value={newVideoDesc}
                  onChange={e => setNewVideoDesc(e.target.value)}
                  className="w-full bg-[#0c1017] border border-[#2e3b4e] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* URL or Direct Source */}
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">
                  Video Source URL (Auto-filled from file upload or paste link)
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://... or loaded from local video file"
                  value={newVideoUrl}
                  onChange={e => setNewVideoUrl(e.target.value)}
                  className="w-full bg-[#0c1017] border border-[#2e3b4e] rounded px-3 py-2 text-xs text-cyan-200 font-mono text-[10.5px] focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Video Live Preview */}
              {newVideoUrl && (
                <div className="bg-black/80 rounded-lg p-2 border border-[#2e3b4e]">
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-1">Live Preview:</p>
                  <div className="aspect-video w-full max-h-36 bg-black rounded overflow-hidden flex items-center justify-center">
                    <video src={newVideoUrl} controls className="w-full h-full object-contain" />
                  </div>
                </div>
              )}

              {/* Broadcast Destinations */}
              <div className="bg-[#090d14] border border-[#2e3b4e] rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-[#2e3b4e] pb-1">
                  Broadcast Destinations
                </p>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newVideoCivicWatch}
                    onChange={e => setNewVideoCivicWatch(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-black border-[#2e3b4e] focus:ring-0"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-cyan-300 flex items-center gap-1">
                      <Tv className="w-3.5 h-3.5" /> Broadcast to CivicWatch HUD Screen (▶ VIDEOS tab)
                    </span>
                    <p className="text-[9.5px] text-gray-400">Plays inside the in-game media player HUD for all citizens.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newVideoBillboards}
                    onChange={e => setNewVideoBillboards(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-500 bg-black border-[#2e3b4e] focus:ring-0"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-purple-300 flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5" /> Broadcast to In-Game City Building Billboards
                    </span>
                    <p className="text-[9.5px] text-gray-400">Streams live onto the 3D building jumbotrons in Gathering Grounds.</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVideoModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs px-6 py-2 rounded-xl uppercase tracking-wider transition shadow-lg"
                >
                  Upload & Broadcast Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: VIDEO SETTINGS / BROADCAST MENU MODAL                            */}
      {/* ========================================================================= */}
      {settingsVideo && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full bg-stainless-steel-panel border-2 border-stainless-steel rounded-2xl p-6 relative shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-white">
            <button
              onClick={() => setSettingsVideo(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Settings className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-black uppercase tracking-tight text-white">
                Video Broadcast Settings
              </h3>
            </div>
            <p className="text-xs text-gray-300 mb-4">
              Configure where "{settingsVideo.title}" is broadcast across CivicWatch screens.
            </p>

            <form onSubmit={handleSaveVideoSettings} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editVideoTitle}
                  onChange={e => setEditVideoTitle(e.target.value)}
                  className="w-full bg-[#0c1017] border border-[#2e3b4e] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editVideoDesc}
                  onChange={e => setEditVideoDesc(e.target.value)}
                  className="w-full bg-[#0c1017] border border-[#2e3b4e] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="bg-[#090d14] border border-[#2e3b4e] rounded-xl p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editVideoCivicWatch}
                    onChange={e => setEditVideoCivicWatch(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-black border-[#2e3b4e] focus:ring-0"
                  />
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                    <Tv className="w-3.5 h-3.5" /> CivicWatch HUD Video Screen
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editVideoBillboards}
                    onChange={e => setEditVideoBillboards(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-500 bg-black border-[#2e3b4e] focus:ring-0"
                  />
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                    <Monitor className="w-3.5 h-3.5" /> 3D City Building Screens & Billboards
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettingsVideo(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs px-5 py-2 rounded-xl uppercase tracking-wider transition"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: FULLSCREEN VIDEO PREVIEW PLAYER MODAL                            */}
      {/* ========================================================================= */}
      {playingVideo && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg animate-fade-in">
          <div className="max-w-3xl w-full bg-[#0b0e14] border border-cyan-500/40 rounded-2xl overflow-hidden relative shadow-[0_25px_70px_rgba(0,0,0,0.9)] text-white">
            <div className="p-3 bg-[#131924] border-b border-[#2e3b4e] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white truncate max-w-md">{playingVideo.title}</h4>
              </div>
              <button
                onClick={() => setPlayingVideo(null)}
                className="text-gray-400 hover:text-white p-1 rounded transition text-sm"
              >
                ✕
              </button>
            </div>

            <div className="relative bg-black aspect-video w-full flex items-center justify-center">
              <video
                src={playingVideo.url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-4 bg-[#0d121b] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <p className="text-[11px] text-gray-300 font-medium">{playingVideo.description || 'No description provided.'}</p>
                <p className="text-[9px] text-gray-500 font-mono mt-1">Creator: {playingVideo.creatorUsername} ({playingVideo.creatorCivicId})</p>
              </div>
              <div className="flex items-center gap-2">
                {playingVideo.shareToCivicWatch && (
                  <span className="text-[9px] bg-cyan-950/80 border border-cyan-400 text-cyan-300 px-2 py-0.5 rounded font-bold">
                    📺 ON CIVICWATCH HUD
                  </span>
                )}
                {playingVideo.shareToBillboards && (
                  <span className="text-[9px] bg-purple-950/80 border border-purple-400 text-purple-300 px-2 py-0.5 rounded font-bold">
                    🏙️ ON BUILDINGS
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: QUICK VAULT BROADCAST SETTINGS MODAL                             */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full bg-stainless-steel-panel border-2 border-stainless-steel rounded-2xl p-6 relative shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-white">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Settings className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-black uppercase tracking-tight text-white">
                Vault Broadcast & Privacy Settings
              </h3>
            </div>
            <p className="text-xs text-gray-300 mb-4">
              Control media sharing across in-game CivicWatch screens and the Foyer FM radio broadcast.
            </p>

            <div className="space-y-3 mb-5">
              {/* Public Sharing */}
              <div className="bg-[#0e131b]/70 border border-[#2e3b4e] rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-cyan-400" /> Public Media Sharing
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Toggle all video streaming to CivicWatch screens & city billboards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleGlobalSharing()}
                  className={`px-3 py-1.5 rounded text-xs font-black uppercase tracking-wider transition shrink-0 ${
                    globalSharing
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                      : 'bg-[#1e2736] hover:bg-[#2a374b] text-gray-300 border border-[#3e4f68]'
                  }`}
                >
                  {globalSharing ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Foyer FM Broadcast */}
              <div className="bg-[#0e131b]/70 border border-[#2e3b4e] rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-orange-400" /> Music to Foyer FM Broadcast
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Broadcast your vault music live across Gathering Grounds on Foyer FM.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleFoyerFmSharing()}
                  className={`px-3 py-1.5 rounded text-xs font-black uppercase tracking-wider transition shrink-0 ${
                    foyerFmSharing
                      ? 'bg-orange-500 hover:bg-orange-400 text-black shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                      : 'bg-[#1e2736] hover:bg-[#2a374b] text-gray-300 border border-[#3e4f68]'
                  }`}
                >
                  {foyerFmSharing ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs px-5 py-2 rounded-xl uppercase tracking-wider transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
