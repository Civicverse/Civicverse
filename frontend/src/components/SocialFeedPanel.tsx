import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, MessageCircle, Repeat2, Share, Search, Home, Bell, Mail, User, Settings,
  Plus, TrendingUp, Users, Hash, Zap, Camera, Video, Image, Mic, MicOff,
  Phone, PhoneOff, Volume2, VolumeX, Play, Pause, SkipForward, SkipBack,
  MoreHorizontal, Bookmark, Flag, Eye, EyeOff, Send, Smile, Paperclip,
  Crown, Shield, Star, Award, Trophy, Gamepad2, Users as UsersIcon,
  MessageSquare, Radio, Tv, ChevronDown, ChevronUp, X, Menu, BarChart3
} from 'lucide-react';

interface Post {
  id: number;
  author: string;
  handle: string;
  avatar: string;
  timestamp: string;
  content: string;
  media?: { type: 'image' | 'video'; url: string };
  likes: number;
  comments: number;
  reposts: number;
  liked: boolean;
  verified?: boolean;
  badge?: string;
}

interface Trend {
  tag: string;
  posts: number;
  category?: string;
}

interface SuggestedUser {
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
  followers: number;
  bio?: string;
}

interface ChatMessage {
  id: number;
  user: string;
  avatar: string;
  message: string;
  timestamp: string;
  type?: 'message' | 'system' | 'game';
}

interface StreamData {
  title: string;
  streamer: string;
  viewers: number;
  thumbnail: string;
  isLive: boolean;
  category: string;
}

export default function SocialFeedPanel() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [currentStream, setCurrentStream] = useState<StreamData | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('general');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeSocialData();
    initializeChat();
    initializeStream();
  }, []);

  const initializeSocialData = () => {
    const samplePosts: Post[] = [
      {
        id: 1,
        author: 'SovereignCitizen',
        handle: '@sovereign',
        avatar: '🏆',
        timestamp: '2m ago',
        content: 'Just won a 32-player BR with 12 kills. The new double-jump vault mechanic is 🔥',
        likes: 2340,
        comments: 156,
        reposts: 420,
        liked: false,
        verified: true,
        badge: 'Pro Player'
      },
      {
        id: 2,
        author: 'NeonRegent',
        handle: '@neonregent',
        avatar: '👑',
        timestamp: '5m ago',
        content: 'New holographic armor cosmetics dropping today. The neon cyan glow is INSANE. 🎮✨',
        media: { type: 'image', url: '/api/placeholder/400/300' },
        likes: 5600,
        comments: 892,
        reposts: 1200,
        liked: false,
        verified: true
      },
      {
        id: 3,
        author: 'CivicGamer',
        handle: '@civicgamer',
        avatar: '⚔️',
        timestamp: '8m ago',
        content: 'LIVE NOW: 6-hour BR grind stream. 50+ viewer bounty active. Come challenge me! 🔴 LIVE',
        likes: 892,
        comments: 445,
        reposts: 234,
        liked: false,
        verified: false
      },
      {
        id: 4,
        author: 'CivicWatch',
        handle: '@civicwatch',
        avatar: '📹',
        timestamp: '12m ago',
        content: 'Weekly BR tournament finals tomorrow at 8 PM UTC. Prize pool: 50,000 CIVIC. Register now! 🏅',
        likes: 3200,
        comments: 567,
        reposts: 1890,
        liked: false,
        verified: true,
        badge: 'Official'
      }
    ];

    const sampleTrends: Trend[] = [
      { tag: '#DoubleJumpMeta', posts: 12400, category: 'Gaming' },
      { tag: '#VaultTricks', posts: 8900, category: 'Tips' },
      { tag: '#NeonArmorSkins', posts: 7600, category: 'Cosmetics' },
      { tag: '#CivicWatch', posts: 5200, category: 'Community' },
      { tag: '#BRTournament', posts: 4100, category: 'Events' },
    ];

    const sampleSuggested: SuggestedUser[] = [
      { name: 'CivicDev', handle: '@civicdev', avatar: '👤', verified: true, followers: 12500, bio: 'Lead Developer' },
      { name: 'GameMaster', handle: '@gamemaster', avatar: '👤', verified: false, followers: 8900, bio: 'Tournament Organizer' },
      { name: 'StreamQueen', handle: '@streamqueen', avatar: '👤', verified: true, followers: 45600, bio: 'Top Streamer' },
    ];

    setPosts(samplePosts);
    setTrends(sampleTrends);
    setSuggestedUsers(sampleSuggested);
  };

  const initializeChat = () => {
    const sampleMessages: ChatMessage[] = [
      { id: 1, user: 'System', avatar: '🤖', message: 'Welcome to CivicVerse Gaming Chat!', timestamp: '10:30 AM', type: 'system' },
      { id: 2, user: 'ProGamer99', avatar: '🎮', message: 'Anyone up for a quick match?', timestamp: '10:31 AM' },
      { id: 3, user: 'NeonNinja', avatar: '🥷', message: 'I\'m in! What game mode?', timestamp: '10:32 AM' },
      { id: 4, user: 'CivicWatch', avatar: '📹', message: 'Tournament registration is now open! Check the sidebar.', timestamp: '10:33 AM', type: 'system' },
      { id: 5, user: 'VaultHunter', avatar: '💎', message: 'Just unlocked the legendary skin! 🔥', timestamp: '10:34 AM' },
    ];
    setChatMessages(sampleMessages);
  };

  const initializeStream = () => {
    const stream: StreamData = {
      title: 'BR Tournament Finals - Live Coverage',
      streamer: 'CivicWatch Official',
      viewers: 12847,
      thumbnail: '/api/placeholder/320/180',
      isLive: true,
      category: 'Esports'
    };
    setCurrentStream(stream);
  };

  const toggleLike = (postId: number) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 };
      }
      return post;
    }));
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: chatMessages.length + 1,
        user: 'You',
        avatar: '👤',
        message: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
      chatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const channels = [
    { id: 'general', name: 'General', icon: Hash, unread: 0 },
    { id: 'gaming', name: 'Gaming', icon: Gamepad2, unread: 3 },
    { id: 'tournaments', name: 'Tournaments', icon: Trophy, unread: 1 },
    { id: 'trading', name: 'Trading', icon: Zap, unread: 0 },
    { id: 'voice-general', name: 'General Voice', icon: Volume2, unread: 0, isVoice: true },
    { id: 'voice-gaming', name: 'Gaming Voice', icon: Volume2, unread: 0, isVoice: true },
  ];

  return (
    <div className="w-full bg-gradient-to-b from-[#0a0c10] via-[#0f1419] to-[#0a0c10] rounded-3xl border border-gray-800/50 overflow-hidden shadow-2xl">
      {/* Full-Width Header - Traditional Social Media Style */}
      <div className="bg-gradient-to-r from-[#1a1d23] to-[#0f1419] border-b border-cyan-500/20 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                CIVICVERSE SOCIAL
              </h1>
            </div>

            {/* Navigation Tabs - Like Twitter/X */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'home'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50'
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button
                onClick={() => setActiveTab('explore')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'explore'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50'
                }`}
              >
                <Hash className="w-4 h-4" />
                Explore
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'notifications'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50'
                }`}
              >
                <Bell className="w-4 h-4" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'messages'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50'
                }`}
              >
                <Mail className="w-4 h-4" />
                Messages
              </button>
              <button
                onClick={() => setActiveTab('communities')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'communities'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50'
                }`}
              >
                <UsersIcon className="w-4 h-4" />
                Communities
              </button>
            </div>
          </div>

          {/* Search and User Actions */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search CivicVerse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all duration-200"
              />
            </div>
            <button className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-cyan-500/30">
              <Plus className="w-5 h-5 text-white" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-gray-800/50 flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-gray-800/50 flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200">
              <Mail className="w-5 h-5 text-gray-400" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Full Width Layout */}
      <div className="flex h-[80vh]">
        {/* Left Sidebar - Discord-like Server List & Channels */}
        <div className="w-64 bg-gradient-to-b from-[#1a1d23] to-[#0f1419] border-r border-gray-800/50 flex flex-col">
          {/* Server List (Top) */}
          <div className="p-3 border-b border-gray-800/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">SERVERS</h3>
              <button className="w-6 h-6 rounded bg-gray-800/50 flex items-center justify-center hover:bg-gray-700/50">
                <Plus className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 cursor-pointer hover:scale-105 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Channels */}
          <div className="flex-1 p-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-sm">CIVICVERSE HUB</h3>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left hover:bg-gray-800/50 transition-colors ${
                    selectedChannel === channel.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'
                  }`}
                >
                  <channel.icon className="w-4 h-4" />
                  <span className="text-sm">{channel.name}</span>
                  {channel.unread > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-1 rounded-full min-w-[16px] h-4 flex items-center justify-center">
                      {channel.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* User Status (Bottom) */}
          <div className="p-3 border-t border-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white text-sm font-medium">You</div>
                <div className="text-gray-400 text-xs">#1234</div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-6 h-6 rounded flex items-center justify-center hover:bg-gray-800/50 ${
                    isMuted ? 'text-red-400' : 'text-gray-400'
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-800/50">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Feed Area - Like Twitter/X */}
        <div className="flex-1 bg-gradient-to-b from-[#0f1419] to-[#0a0c10] border-r border-gray-800/50 flex flex-col">
          {/* Compose Box - Like Twitter */}
          <div className="p-4 border-b border-gray-800/50">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                👤
              </div>
              <div className="flex-1">
                <textarea
                  placeholder="What's happening in CivicVerse?"
                  className="w-full p-3 bg-transparent border-none resize-none text-white placeholder-gray-400 focus:outline-none text-xl"
                  rows={3}
                />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-4 text-cyan-400">
                    <button className="hover:text-cyan-300 transition-colors">
                      <Image className="w-5 h-5" />
                    </button>
                    <button className="hover:text-cyan-300 transition-colors">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="hover:text-cyan-300 transition-colors">
                      <BarChart3 className="w-5 h-5" />
                    </button>
                    <button className="hover:text-cyan-300 transition-colors">
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                  <button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-200">
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-gray-800/50">
              {posts.map((post) => (
                <div key={post.id} className="p-4 hover:bg-gray-900/20 transition-colors cursor-pointer">
                  {/* Post Header */}
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg text-lg shadow-cyan-500/30">
                      {post.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{post.author}</span>
                        {post.verified && <Shield className="w-4 h-4 text-cyan-400" />}
                        {post.badge && (
                          <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-1 rounded-full">
                            {post.badge}
                          </span>
                        )}
                        <span className="text-gray-500 text-sm">{post.handle}</span>
                        <span className="text-gray-500 text-sm">·</span>
                        <span className="text-gray-500 text-sm">{post.timestamp}</span>
                      </div>
                    </div>
                    <button className="text-gray-500 hover:text-gray-400">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="mb-3">
                    <p className="text-white text-lg leading-relaxed">{post.content}</p>
                    {post.media && (
                      <div className="mt-3 rounded-2xl overflow-hidden border border-gray-800/50">
                        {post.media.type === 'image' ? (
                          <img src={post.media.url} alt="Post media" className="w-full h-64 object-cover" />
                        ) : (
                          <video src={post.media.url} className="w-full h-64 object-cover" controls />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Post Actions - Like Twitter */}
                  <div className="flex justify-between text-gray-500 text-sm py-2 px-2 max-w-md">
                    <button className="flex items-center gap-2 hover:text-blue-400 group transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full group-hover:bg-blue-500/20">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span className="group-hover:text-blue-400">{post.comments}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-green-400 group transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-green-500/20">
                        <Repeat2 className="w-4 h-4" />
                      </div>
                      <span className="group-hover:text-green-400">{post.reposts}</span>
                    </button>
                    <button
                      onClick={() => toggleLike(post.id)}
                      className="flex items-center gap-2 hover:text-red-400 group transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-red-500/20">
                        <Heart className={`w-4 h-4 ${post.liked ? 'fill-red-500 text-red-500' : ''}`} />
                      </div>
                      <span className={post.liked ? 'text-red-500' : 'group-hover:text-red-400'}>{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-blue-400 group transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-blue-500/20">
                        <Bookmark className="w-4 h-4" />
                      </div>
                    </button>
                    <button className="flex items-center gap-2 hover:text-blue-400 group transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-blue-500/20">
                        <Share className="w-4 h-4" />
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Mixed Content */}
        <div className="w-80 bg-gradient-to-b from-[#1a1d23] to-[#0f1419] border-r border-gray-800/50 flex flex-col">
          {/* Game Chat Section */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-800/50">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  Game Chat
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsVoiceConnected(!isVoiceConnected)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isVoiceConnected ? 'bg-green-500/20 text-green-400' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                    }`}
                  >
                    {isVoiceConnected ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center text-gray-400 hover:bg-gray-700/50">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.type === 'system' ? 'justify-center' : ''}`}>
                  {message.type !== 'system' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg text-sm shadow-cyan-500/30 flex-shrink-0">
                      {message.avatar}
                    </div>
                  )}
                  <div className={`flex-1 ${message.type === 'system' ? 'text-center' : ''}`}>
                    {message.type === 'system' ? (
                      <div className="bg-cyan-500/20 text-cyan-400 text-sm px-3 py-1 rounded-lg inline-block">
                        {message.message}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium text-sm">{message.user}</span>
                          <span className="text-gray-500 text-xs">{message.timestamp}</span>
                        </div>
                        <p className="text-gray-300 text-sm">{message.message}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-800/50">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  onClick={sendMessage}
                  className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-cyan-500/30"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* CivicWatch Live Stream Section */}
          <div className="border-t border-gray-800/50">
            {currentStream && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <Radio className="w-5 h-5 text-red-400" />
                    CivicWatch Live
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-red-400">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium">LIVE</span>
                    </div>
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm">{currentStream.viewers.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-lg overflow-hidden mb-3">
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <Play className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Live Stream</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-white font-medium text-sm">{currentStream.title}</h4>
                  <p className="text-gray-400 text-sm">{currentStream.streamer}</p>
                  <div className="flex items-center gap-2">
                    <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-1 rounded">
                      {currentStream.category}
                    </span>
                  </div>
                </div>

                {/* Stream Controls */}
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button className="w-10 h-10 rounded-lg bg-gray-800/50 flex items-center justify-center text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors">
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-cyan-500/30">
                    <Play className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
