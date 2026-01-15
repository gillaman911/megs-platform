
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard, Newspaper, Calendar, Settings as SettingsIcon, PlusCircle, Zap,
  Search, Share2, Youtube, Twitter, Facebook, Instagram, CheckCircle2,
  Clock, Loader2, Image as ImageIcon, Video, ArrowRight, AlertCircle, Rocket,
  ExternalLink, Wand2, RefreshCcw, Copy, ChevronLeft, Eye, Save, Globe, Lock, ShieldCheck, Send, Activity, Edit3, X as CloseIcon,
  Hash, Type as TypeIcon, FileText, Share, Trash2, Clapperboard, Play, Download, Linkedin, MonitorSmartphone, ThumbsUp, CalendarRange, HelpCircle, ChevronDown, ChevronUp, Link as LinkIcon, Layers, ClipboardCheck, MousePointerClick, Cpu, FileImage, Sparkles, Terminal, Info, Key, Server, BarChart3, Coins, Database, Palette, Lightbulb, FileJson, Table, History, Wand, Bold, Italic, List, Heading2, RotateCcw, Check, Upload, ImageIcon as ImageLucide, Eraser, Filter, Wand as WandIcon, CloudDownload, Home
} from 'lucide-react';
import { PostStatus, ContentPost, TechNewsTrend, SocialVariation, Credentials, ContentType } from './types';
import { searchTrendingTechNews, generateFullBlogPost, generateBlogImage, rewriteSelection, generateImageForPlaceholder, editImageWithAi } from './geminiService';
import { publishToLiveBlog, updateLiveBlog, fetchLivePosts, publishToFacebook } from './apiService';
import { PROFILES, DEFAULT_PROFILE, AppProfile } from './config';

const STORAGE_KEYS = {
  POSTS: 'teknowguy_posts',
  TRENDS: 'teknowguy_trends',
  CREDS: 'teknowguy_credentials',
  PROFILE: 'megs_profile'
};

const DEFAULT_CREDS: Credentials = {
  blogApiKey: '39884e58f42587fd6ce1ad1fb1cb6cfe8c3a5af7357a0baf910a606d29a03aa6',
  adobeExpressEndpoint: 'https://api.adobe.io/content/v1/assets',
  adobeAccessToken: '',
  facebookAccessToken: '',
  facebookPageId: '',
  autoPilotEnabled: false,
  connectionMode: 'direct'
};

const RichTextEditor: React.FC<{
  initialHtml: string;
  onChange: (html: string) => void;
  isEditing: boolean;
  onAiRewrite: (mode: 'selection' | 'full') => void;
  onUploadImage: (file: File) => void;
  onAiEditAsset: (prompt: string) => void;
  isRegenerating: boolean;
}> = ({ initialHtml, onChange, isEditing, onAiRewrite, onUploadImage, onAiEditAsset, isRegenerating }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);
  const [showAiEditPrompt, setShowAiEditPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  useEffect(() => {
    if (isEditing && editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = initialHtml;
      isInitialized.current = true;
    }
    if (!isEditing) isInitialized.current = false;
  }, [isEditing, initialHtml]);

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  if (!isEditing) {
    return (
      <div
        className="prose prose-invert prose-lg max-w-none text-slate-300 leading-relaxed 
                  prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter prose-headings:text-white
                  prose-p:mb-6 prose-li:text-slate-400 prose-strong:text-red-500
                  [&_img]:rounded-[32px] [&_img]:my-10 [&_img]:border [&_img]:border-white/10"
        dangerouslySetInnerHTML={{ __html: initialHtml || '' }}
      />
    );
  }

  return (
    <div className="flex flex-col space-y-4 animate-in fade-in duration-500 min-h-[500px]">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onUploadImage(e.target.files[0])} />
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-1 p-10 bg-black/40 border border-white/5 rounded-[40px] text-slate-300 outline-none focus:border-red-600/30 transition-all 
                  prose prose-invert prose-lg max-w-none
                  prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter prose-headings:text-white
                  prose-p:mb-6 prose-li:text-slate-400 prose-strong:text-red-500
                  [&_img]:rounded-[32px] [&_img]:my-10 [&_img]:border [&_img]:border-white/10
                  selection:bg-red-600/30 selection:text-white"
      />
      <div className="p-3 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl space-y-3">
        {showAiEditPrompt ? (
          <div className="flex items-center gap-3 p-2 bg-black/40 rounded-2xl animate-in slide-in-from-bottom-2">
            <Sparkles className="text-red-500 ml-2" size={16} />
            <input
              autoFocus
              placeholder="E.G. 'ADD A RETRO FILTER' OR 'REMOVE BACKGROUND'..."
              className="flex-1 bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-white placeholder:opacity-30"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (onAiEditAsset(aiPrompt), setShowAiEditPrompt(false), setAiPrompt(''))}
            />
            <button onClick={() => { onAiEditAsset(aiPrompt); setShowAiEditPrompt(false); setAiPrompt(''); }} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">APPLY</button>
            <button onClick={() => setShowAiEditPrompt(false)} className="px-4 py-2 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">CANCEL</button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            <ToolbarButton onClick={() => execCommand('bold')} icon={<Bold size={16} />} label="B" />
            <ToolbarButton onClick={() => execCommand('italic')} icon={<Italic size={16} />} label="I" />
            <ToolbarButton onClick={() => execCommand('formatBlock', 'h2')} icon={<Heading2 size={16} />} label="H2" />
            <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={<List size={16} />} label="List" />
            <ToolbarButton onClick={() => fileInputRef.current?.click()} icon={<Upload size={16} />} label="Upload" />
            <ToolbarButton onClick={() => setShowAiEditPrompt(true)} icon={<Wand2 size={16} className="text-red-500" />} label="AI Edit Image" />
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => onAiRewrite('selection')}
                disabled={isRegenerating}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all"
              >
                <WandIcon size={12} /> REWRITE SELECTION
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ToolbarButton: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string; className?: string }> = ({ onClick, icon, label, className }) => (
  <button
    onClick={(e) => { e.preventDefault(); onClick(); }}
    title={label}
    className={`p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all flex items-center gap-2 ${className}`}
  >
    {icon} <span className="text-[10px] font-black">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trends' | 'editor' | 'schedule' | 'settings'>('dashboard');
  const [posts, setPosts] = useState<ContentPost[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.POSTS);
    return saved ? JSON.parse(saved) : [];
  });
  const [trends, setTrends] = useState<TechNewsTrend[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRENDS);
    return saved ? JSON.parse(saved) : [];
  });
  const [creds, setCreds] = useState<Credentials>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CREDS);
    return saved ? JSON.parse(saved) : DEFAULT_CREDS;
  });
  const [profile, setProfile] = useState<AppProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string>("");
  const [message, setMessage] = useState<{ text: string, type: 'info' | 'success' | 'error' | 'bridge' } | null>(null);
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  const viewingPost = useMemo(() => posts.find(p => p.id === viewingPostId) || null, [posts, viewingPostId]);

  useEffect(() => {
    const checkKeySelection = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else { setHasApiKey(true); }
    };
    checkKeySelection();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    localStorage.setItem(STORAGE_KEYS.TRENDS, JSON.stringify(trends));
    localStorage.setItem(STORAGE_KEYS.CREDS, JSON.stringify(creds));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [posts, trends, creds, profile]);

  useEffect(() => {
    if (hasApiKey && trends.length === 0) {
      searchTrendingTechNews(setStatusText, profile.prompts.newsSearch).then(setTrends).catch(console.error);
    }
  }, [hasApiKey, profile]);

  // MEGS Pulse: Client-side Scheduler
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      posts.forEach(p => {
        if (p.status === PostStatus.SCHEDULED && p.scheduledDate && new Date(p.scheduledDate) <= now) {
          handleFullDeployment(p);
        }
      });
    };
    const interval = setInterval(checkSchedule, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [posts]);

  const showNotification = (text: string, type: 'info' | 'success' | 'error' | 'bridge' = 'info') => {
    setMessage({ text, type });
    if (type !== 'bridge') { setTimeout(() => setMessage(null), 8000); }
  };

  const handleUpdatePost = (updatedPost: ContentPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    showNotification("Mission memory synchronized.", "success");
  };

  const handleDeletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    setViewingPostId(null);
    showNotification("Mission purged.", 'info');
  };

  const handleSyncCloud = async () => {
    setLoading(true);
    setStatusText("Downloading Cloud Repository...");
    try {
      const cloudPosts = await fetchLivePosts(creds.blogApiKey);
      setPosts(prev => {
        const localOnly = prev.filter(p => !p.externalId);
        const merged = [...localOnly, ...cloudPosts];
        const seen = new Set();
        return merged.filter(p => {
          const id = p.externalId || p.id;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      });
      showNotification(`Archival memory restored: ${cloudPosts.length} posts.`, "success");
    } catch (e: any) {
      showNotification(`Uplink Error: ${e.message}`, "error");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  const handleFullDeployment = async (post: ContentPost) => {
    if (loading) return; // Basic lockout, but for auto-scheduler we might want concurrent handling in future
    setLoading(true);
    setStatusText(post.externalId ? "Syncing Revisions..." : "Deploying Site Protocol...");

    // Optimistic update for notifications if auto-running
    if (post.status === PostStatus.SCHEDULED) {
      showNotification(`AUTO-LAUNCH: Deploying ${post.title}...`, 'bridge');
    }

    try {
      if (post.externalId) {
        await updateLiveBlog(post, creds.blogApiKey);
        setPosts(prev => prev.map(p => p.id === post.id ? { ...post, status: PostStatus.LIVE } : p));
        showNotification("Intelligence Reposted Successfully.", "success");
      } else {
        const result = await publishToLiveBlog(post, creds.blogApiKey);
        const liveId = result?.id || result?.data?.id || post.id;
        setPosts(prev => prev.map(p => p.id === post.id ? { ...post, status: PostStatus.LIVE, externalId: liveId } : p));
        showNotification("Initial Orchestration Live.", 'success');
      }
    } catch (error: any) {
      showNotification(error.message || "Uplink Failure", "error");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  const handleQuickPublish = async (trend: TechNewsTrend) => {
    setLoading(true);
    setStatusText("Analyzing Vectors...");
    try {
      const blogData = await generateFullBlogPost(trend.title, "", 'News', setStatusText as any, profile.prompts.editorialGen);
      const imageUrl = await generateBlogImage(blogData.title || trend.title, setStatusText as any, profile.prompts.imageGen);
      const newPost: ContentPost = {
        id: Math.random().toString(36).substr(2, 9),
        title: blogData.title || trend.title,
        excerpt: blogData.excerpt || trend.snippet,
        fullBody: blogData.fullBody || "",
        imageUrl,
        status: PostStatus.SCHEDULED,
        scheduledDate: new Date().toISOString(),
        category: "Tech News",
        contentType: 'News',
        seoKeywords: blogData.seoKeywords || [],
        variations: blogData.variations || [],
        sourceUrl: trend.url
      };
      setPosts(prev => [newPost, ...prev]);
      showNotification("News drafted successfully.", 'success');
      setActiveTab('schedule');
    } catch (error: any) {
      showNotification(`Sequence Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  const changeProfile = (profileId: string) => {
    console.log('Attempting to switch profile to:', profileId, 'Available profiles:', Object.keys(PROFILES));
    if (PROFILES[profileId]) {
      setProfile(PROFILES[profileId]);
      // Also reset trends as they are profile specific
      setTrends([]);
      showNotification(`Profile switched to ${PROFILES[profileId].appName}`, 'success');
    } else {
      console.error('Profile not found:', profileId);
    }
  };

  // Dynamic Theme Colors
  const accentColor = profile.id === 'real-estate' ? 'text-blue-500' : 'text-red-600';
  const bgColor = profile.id === 'real-estate' ? 'bg-blue-600' : 'bg-red-600';
  const borderColor = profile.id === 'real-estate' ? 'border-blue-500' : 'border-red-500';

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200 font-sans">
      <aside className="w-64 bg-slate-950 border-r border-white/5 flex flex-col fixed h-full z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12 group cursor-default">
            <div className={`${bgColor} p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg`}>
              {profile.id === 'real-estate' ? <Home className="text-white" size={20} /> : <Palette className="text-white" size={20} />}
            </div>
            <h1 className="text-xl font-black text-white uppercase tracking-tighter italic">{profile.appName}</h1>
            <span className="text-[9px] font-mono text-slate-500 mt-1">v1.3</span>
          </div>
          <nav className="space-y-2">
            <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setViewingPostId(null); }} colorClass={bgColor} />
            <SidebarItem icon={<Search size={20} />} label="Trends" active={activeTab === 'trends'} onClick={() => { setActiveTab('trends'); setViewingPostId(null); }} colorClass={bgColor} />
            <SidebarItem icon={<PlusCircle size={20} />} label="Compose" active={activeTab === 'editor'} onClick={() => { setActiveTab('editor'); setViewingPostId(null); }} colorClass={bgColor} />
            <SidebarItem icon={<Calendar size={20} />} label="Pipeline" active={activeTab === 'schedule'} onClick={() => { setActiveTab('schedule'); setViewingPostId(null); }} colorClass={bgColor} />
            <SidebarItem icon={<SettingsIcon size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setViewingPostId(null); }} colorClass={bgColor} />
          </nav>
        </div>
        {loading && (
          <div className={`mt-auto p-5 mx-6 mb-8 bg-white/5 ${borderColor}/20 border rounded-2xl animate-pulse`}>
            <div className={`flex items-center gap-2 ${accentColor} text-[10px] font-black uppercase mb-1.5 tracking-widest`}>
              <Loader2 size={12} className="animate-spin" /> Processing
            </div>
            <p className="text-[11px] text-slate-400 font-medium italic truncate">{statusText}</p>
          </div>
        )}
      </aside>

      <main className="flex-1 ml-64 p-12 min-h-screen relative overflow-x-hidden">
        <header className="mb-16 flex justify-between items-end">
          <div>
            <h2 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">
              {viewingPost ? 'MISSION BRIEF' : activeTab.toUpperCase()}
            </h2>
            <p className="text-slate-600 font-black uppercase tracking-[0.4em] mt-4 text-[10px]">
              {viewingPost ? 'ANALYTICAL BREAKDOWN' : profile.appDescription}
            </p>
          </div>
          {!viewingPost && (activeTab === 'dashboard' || activeTab === 'schedule') && (
            <button
              onClick={handleSyncCloud}
              disabled={loading}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CloudDownload size={14} className="text-blue-500" />} SYNC CLOUD POSTS
            </button>
          )}
        </header>

        {message && (
          <div className={`fixed bottom-10 right-10 z-50 px-8 py-5 rounded-[24px] shadow-3xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 border border-white/10 backdrop-blur-3xl ${message.type === 'success' ? 'bg-green-600/90' : message.type === 'bridge' ? 'bg-blue-600/90' : 'bg-red-600/90'}`}>
            <Zap size={24} /><span className="font-black text-sm uppercase tracking-widest">{message.text}</span>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {viewingPost ? (
            <PostDetailView post={viewingPost} creds={creds} onBack={() => setViewingPostId(null)} onLivePublish={handleFullDeployment} onUpdatePost={handleUpdatePost} onDeletePost={handleDeletePost} loading={loading} showNotification={showNotification} profile={profile} />
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardView posts={posts} onManagePost={(p) => setViewingPostId(p.id)} profile={profile} />}
              {activeTab === 'trends' && <TrendsView trends={trends} onPublish={handleQuickPublish} loading={loading} profile={profile} resetTrends={() => setTrends([])} fetchTrends={() => searchTrendingTechNews(setStatusText, profile.prompts.newsSearch).then(setTrends)} />}
              {activeTab === 'editor' && <EditorView onSave={(p) => { setPosts(prev => [p as ContentPost, ...prev]); setActiveTab('schedule'); }} loading={loading} setStatusText={setStatusText} showNotification={showNotification} setLoading={setLoading} profile={profile} />}
              {activeTab === 'schedule' && <ScheduleView posts={posts} onManagePost={(p) => setViewingPostId(p.id)} profile={profile} />}
              {activeTab === 'settings' && <SettingsView creds={creds} setCreds={setCreds} profile={profile} onChangeProfile={changeProfile} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

const PostDetailView: React.FC<{ post: ContentPost, creds: Credentials, onBack: () => void, onLivePublish: (p: ContentPost) => void, onUpdatePost: (p: ContentPost) => void, onDeletePost: (id: string) => void, loading: boolean, showNotification: any, profile: AppProfile }> = ({ post, creds, onBack, onLivePublish, onUpdatePost, onDeletePost, loading, showNotification, profile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPost, setEditedPost] = useState(post);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showCoverEditPrompt, setShowCoverEditPrompt] = useState(false);
  const [coverEditPrompt, setCoverEditPrompt] = useState('');
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const buttonClass = profile.id === 'real-estate' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500';

  useEffect(() => {
    if (!isEditing) setEditedPost(post);
  }, [post, isEditing]);

  const handleAiRewrite = async (mode: 'selection' | 'full') => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    try {
      let targetText = editedPost.fullBody;
      let selection = window.getSelection();
      let selectedText = selection?.toString() || "";
      if (mode === 'selection' && !selectedText) {
        showNotification("Highlight a segment for AI recalibration.", "info");
        setIsRegenerating(false);
        return;
      }
      const result = await rewriteSelection(
        mode === 'selection' ? selectedText : targetText,
        editedPost.fullBody,
        mode === 'full' ? "Rewrite body for higher authority." : "Enhance details.",
        (s) => console.log(s)
      );
      if (mode === 'selection' && selection && selection.rangeCount > 0) {
        document.execCommand('insertHTML', false, result);
        const editor = document.querySelector('[contenteditable="true"]');
        if (editor) setEditedPost({ ...editedPost, fullBody: editor.innerHTML });
      } else {
        setEditedPost({ ...editedPost, fullBody: result });
      }
      showNotification("Segment recalibrated.", "success");
    } catch (e) {
      showNotification("Recalibration failure.", "error");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleUploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const newBody = editedPost.fullBody + `<img src="${result}" alt="Manual Upload" class="w-full rounded-[40px] shadow-2xl border border-white/10 my-12" />`;
      setEditedPost({ ...editedPost, fullBody: newBody });
      showNotification("Asset integrated.", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleAiEditCover = async () => {
    if (isRegenerating || !coverEditPrompt || !editedPost.imageUrl) return;
    setIsRegenerating(true);
    showNotification(`Nano Edit: ${coverEditPrompt}...`, "info");
    try {
      const edited = await editImageWithAi(editedPost.imageUrl, coverEditPrompt);
      setEditedPost({ ...editedPost, imageUrl: edited });
      showNotification("Cover recalibrated successfully.", "success");
      setShowCoverEditPrompt(false);
      setCoverEditPrompt('');
    } catch (e) {
      showNotification("AI Edit failed.", "error");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAiEditAsset = async (prompt: string) => {
    if (isRegenerating || !prompt) return;
    const selection = window.getSelection();
    let targetImg: HTMLImageElement | null = null;
    if (selection && selection.rangeCount > 0) {
      const container = selection.getRangeAt(0).startContainer;
      const parent = container.nodeType === 1 ? container as HTMLElement : container.parentElement;
      if (parent) {
        targetImg = parent.querySelector('img') || parent.closest('img');
      }
    }
    if (!targetImg) {
      showNotification("Highlight or click an image in the editor to edit it.", "info");
      return;
    }
    setIsRegenerating(true);
    showNotification(`Editing Asset: ${prompt}...`, "info");
    try {
      const result = await editImageWithAi(targetImg.src, prompt);
      targetImg.src = result;
      const editor = document.querySelector('[contenteditable="true"]');
      if (editor) setEditedPost({ ...editedPost, fullBody: editor.innerHTML });
      showNotification("Asset recalibrated.", "success");
    } catch (e) {
      showNotification("AI Asset edit failed.", "error");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerateCover = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    showNotification("Regenerating Cover Asset...", "info");
    try {
      const img = await generateBlogImage(editedPost.title, (s) => console.log(s), profile.prompts.imageGen);
      setEditedPost({ ...editedPost, imageUrl: img });
      showNotification("Cover regenerated.", "success");
    } catch (e) {
      showNotification("Cover failure.", "error");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownloadImage = () => {
    if (!editedPost.imageUrl) return;
    const link = document.createElement('a');
    link.href = editedPost.imageUrl;
    const safeTitle = editedPost.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeTitle}_cover.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Downloading visual asset...", "info");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification("Copied to clipboard.", "success");
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-24">
      <div className="bg-slate-900/20 border border-white/5 p-12 rounded-[50px] shadow-5xl backdrop-blur-3xl">
        <div className="flex justify-between mb-12">
          <button onClick={onBack} className="text-slate-500 hover:text-white flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all"><ChevronLeft size={16} /> EXIT</button>
          <div className="flex gap-4">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400">ABORT</button>
                <button onClick={() => { onUpdatePost(editedPost); setIsEditing(false); }} className="px-8 py-3 bg-green-600/20 border border-green-500 text-green-500 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">COMMIT MEMORY</button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"><Edit3 size={14} className="inline mr-2" /> MODIFY INTELLIGENCE</button>
                <button onClick={() => onDeletePost(post.id)} className="p-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl border border-red-500/20 transition-all"><Trash2 size={20} /></button>
              </>
            )}
          </div>
        </div>
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <div className={`mx-auto px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit ${post.status === PostStatus.LIVE ? 'text-green-500 border-green-500/20' : 'text-red-500 border-red-500/20'}`}>{post.status === PostStatus.LIVE ? 'LIVE' : 'PIPELINE'}</div>
            {isEditing ? (
              <input value={editedPost.title} onChange={e => setEditedPost({ ...editedPost, title: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-4xl font-black text-white text-center uppercase outline-none focus:border-red-600/50" />
            ) : (
              <h3 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-tight">{post.title}</h3>
            )}
          </div>
          <div className="aspect-video w-full rounded-[40px] overflow-hidden border border-white/10 relative group bg-black shadow-4xl">
            <img src={editedPost.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none"></div>
            {!isEditing && (
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleDownloadImage}
                  className="p-4 bg-black/60 backdrop-blur-md hover:bg-red-600 text-white rounded-2xl border border-white/10 transition-all shadow-xl flex items-center gap-2 group/btn"
                >
                  <Download size={20} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Download Asset</span>
                </button>
              </div>
            )}
            {isEditing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-slate-950/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity p-8">
                {showCoverEditPrompt ? (
                  <div className="w-full max-w-md space-y-4 animate-in zoom-in-95">
                    <input
                      autoFocus
                      placeholder="ADD A RETRO FILTER..."
                      className="w-full bg-black/60 border border-white/20 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-red-600/50"
                      value={coverEditPrompt}
                      onChange={e => setCoverEditPrompt(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAiEditCover()}
                    />
                    <div className="flex gap-2">
                      <button onClick={handleAiEditCover} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">APPLY EDIT</button>
                      <button onClick={() => setShowCoverEditPrompt(false)} className="px-6 py-3 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">CANCEL</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-center gap-4">
                    <input type="file" ref={coverFileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (re) => { setEditedPost({ ...editedPost, imageUrl: re.target?.result as string }); showNotification("Cover asset updated.", "success"); };
                      reader.readAsDataURL(file);
                    }} />
                    <button onClick={() => setShowCoverEditPrompt(true)} className="px-8 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 transition-all">
                      <WandIcon size={16} /> AI PROMPT EDIT
                    </button>
                    <button onClick={handleRegenerateCover} className="px-8 py-4 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 border border-white/10 hover:scale-105 transition-all">
                      <RefreshCcw size={16} /> AI REGENERATE
                    </button>
                    <button onClick={() => coverFileInputRef.current?.click()} className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                      <Upload size={16} /> UPLOAD
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <RichTextEditor
            initialHtml={isEditing ? editedPost.fullBody : post.fullBody}
            isEditing={isEditing}
            onChange={(html) => setEditedPost({ ...editedPost, fullBody: html })}
            onAiRewrite={handleAiRewrite}
            onUploadImage={handleUploadImage}
            onAiEditAsset={handleAiEditAsset}
            isRegenerating={isRegenerating}
          />
          <div className="pt-12 border-t border-white/5 space-y-8">
            <div className="flex items-center gap-4">
              <Share2 className="text-red-500" size={24} />
              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Mission Dispatch Spinoffs</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {post.variations.map((v, idx) => (
                <div key={idx} className="p-8 bg-black/40 border border-white/5 rounded-[32px] flex flex-col group hover:border-red-600/30 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      {v.platform === 'LinkedIn' && <Linkedin className="text-blue-500" size={18} />}
                      {v.platform === 'X' && <Twitter className="text-slate-200" size={18} />}
                      {v.platform === 'Facebook' && <Facebook className="text-blue-600" size={18} />}
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{v.platform}</span>
                    </div>
                    <button onClick={() => copyToClipboard(v.content)} className="p-2 bg-white/5 text-slate-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"><Copy size={14} /></button>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed flex-1 line-clamp-6">{v.content}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {v.hashtags?.map((h, hIdx) => <span key={hIdx} className="text-[9px] font-black text-red-500/50 uppercase tracking-widest">{h}</span>)}
                  </div>
                </div>
              ))}
              {post.variations.length === 0 && (
                <div className="col-span-3 p-10 text-center bg-white/5 rounded-[32px] text-slate-600 font-black uppercase italic opacity-20">No spinoffs generated.</div>
              )}
            </div>
          </div>
          <button
            onClick={() => onLivePublish(editedPost)}
            disabled={loading || isEditing}
            className={`w-full py-10 text-white rounded-[40px] font-black text-2xl shadow-5xl uppercase tracking-widest italic transition-all flex items-center justify-center gap-4 group disabled:opacity-30 ${buttonClass}`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Globe className="group-hover:rotate-[360deg] transition-transform duration-1000" />}
            {post.externalId ? 'PUSH REVISIONS TO LIVE SITE' : 'DEPLOY LIVE PROTOCOL'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardView: React.FC<{ posts: ContentPost[], onManagePost: (p: ContentPost) => void, profile: AppProfile }> = ({ posts, onManagePost, profile }) => {
  const recentLive = posts.filter(p => p.status === PostStatus.LIVE).slice(0, 3);
  const upcoming = posts.filter(p => p.status === PostStatus.SCHEDULED).slice(0, 3);
  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard label="Archival Integrity" value={recentLive.length} icon={<Globe className="text-green-500" />} />
        <StatCard label="Pipeline Momentum" value={upcoming.length} icon={<CalendarRange className="text-red-500" />} />
        <StatCard label="Intelligence Quotient" value={posts.length} icon={<Cpu className="text-purple-500" />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2"><History className="text-green-500" size={24} /><h4 className="text-xl font-black text-white uppercase tracking-widest italic">Archival Memory</h4></div>
          <div className="space-y-4">{recentLive.length === 0 && <p className="p-10 text-center bg-white/5 rounded-3xl text-slate-600 font-black uppercase italic opacity-20">Memory void.</p>}{recentLive.map(p => <DashboardPostItem key={p.id} post={p} onClick={() => onManagePost(p)} />)}</div>
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2"><Zap className="text-red-500" size={24} /><h4 className="text-xl font-black text-white uppercase tracking-widest italic">Upcoming Pipeline</h4></div>
          <div className="space-y-4">{upcoming.length === 0 && <p className="p-10 text-center bg-white/5 rounded-3xl text-slate-600 font-black uppercase italic opacity-20">Pipeline null.</p>}{upcoming.map(p => <DashboardPostItem key={p.id} post={p} onClick={() => onManagePost(p)} />)}</div>
        </div>
      </div>
    </div>
  );
};

const DashboardPostItem: React.FC<{ post: ContentPost, onClick: () => void }> = ({ post, onClick }) => (
  <div onClick={onClick} className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl hover:bg-white/5 cursor-pointer transition-all flex items-center justify-between group shadow-xl">
    <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg"><img src={post.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" /></div><div><h5 className="font-black text-white text-sm uppercase italic line-clamp-1 group-hover:text-red-500 transition-colors">{post.title}</h5><span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{new Date(post.publishedAt || post.scheduledDate).toLocaleDateString()}</span></div></div>
    <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-500 translate-x-4 group-hover:translate-x-0 transition-transform"><ArrowRight size={18} /></div>
  </div>
);

const StatCard: React.FC<{ label: string, value: number, icon: any }> = ({ label, value, icon }) => (
  <div className="bg-slate-900/30 border border-white/5 p-10 rounded-[40px] backdrop-blur-sm group hover:border-red-600/30 transition-all shadow-xl">
    <div className="flex justify-between items-center mb-6"><span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}</span><div className="p-3 bg-white/5 rounded-xl">{icon}</div></div>
    <div className="text-6xl font-black text-white">{value}</div>
  </div>
);

const TrendsView: React.FC<{ trends: TechNewsTrend[], onPublish: (t: TechNewsTrend) => void, loading: boolean, profile: AppProfile, resetTrends: () => void, fetchTrends: () => void }> = ({ trends, onPublish, loading, profile, resetTrends, fetchTrends }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <button onClick={fetchTrends} className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><RefreshCcw size={12} /> REFRESH INTEL</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {trends.map((t, i) => (
        <div key={i} className="bg-slate-900/30 border border-white/5 p-8 rounded-[40px] flex flex-col hover:border-red-600/50 transition-all group backdrop-blur-sm relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity"><ArrowRight size={24} /></div>
          <h4 className="text-xl font-black text-white mb-4 line-clamp-2 uppercase italic leading-tight">{t.title}</h4>
          <p className="text-slate-500 text-sm line-clamp-4 flex-1 mb-8 leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">{t.snippet}</p>
          <button onClick={() => onPublish(t)} disabled={loading} className={`w-full py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${profile.id === 'real-estate' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500'}`}>Draft Intelligence</button>
        </div>
      ))}
    </div>
  </div>
);

const EditorView: React.FC<{ onSave: (p: any) => void, loading: boolean, setStatusText: (s: string) => void, showNotification: any, setLoading: (l: boolean) => void, profile: AppProfile }> = ({ onSave, loading, setStatusText, showNotification, setLoading, profile }) => {
  const [topic, setTopic] = useState('');
  const [companyNews, setCompanyNews] = useState('');
  const [type, setType] = useState<ContentType>('News');
  const [publishDate, setPublishDate] = useState(new Date().toISOString().slice(0, 16));
  const handleOrchestrate = async () => {
    setLoading(true);
    try {
      const data = await generateFullBlogPost(topic, companyNews, type, setStatusText as any, profile.prompts.editorialGen);
      const img = await generateBlogImage(data.title || topic, setStatusText as any, profile.prompts.imageGen);
      onSave({ ...data, id: Math.random().toString(36).substr(2, 9), imageUrl: img, contentType: type, status: PostStatus.SCHEDULED, scheduledDate: new Date(publishDate).toISOString(), category: type === 'News' ? 'Breaking' : 'Pro Tips' });
    } catch (e: any) { showNotification(e.message, "error"); } finally { setLoading(false); setStatusText(""); }
  };

  const buttonClass = profile.id === 'real-estate' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20' : 'bg-red-600 hover:bg-red-500 shadow-red-600/20';
  const activeTypeClass = profile.id === 'real-estate' ? 'bg-blue-600 shadow-blue-600/20' : 'bg-red-600 shadow-red-600/20';

  return (
    <div className="max-w-4xl space-y-10 animate-in slide-in-from-bottom-10 duration-700">
      <div className="flex gap-4 p-2 bg-slate-900/50 rounded-[30px] w-fit border border-white/5 mb-8">{(['News', 'Tip'] as ContentType[]).map(t => <button key={t} onClick={() => setType(t)} className={`px-10 py-3 rounded-[24px] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${type === t ? `${activeTypeClass} text-white` : 'text-slate-600 hover:text-white'}`}>{t === 'News' ? <Newspaper size={14} /> : <Lightbulb size={14} />} {t} Editorial</button>)}</div>
      <div className="space-y-8">
        <div className="space-y-4"><label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-4">Editorial Concept Vector</label><input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="ENTER CORE CONCEPT..." className="w-full bg-slate-900/30 border border-white/10 rounded-[32px] px-8 py-6 text-2xl font-black text-white outline-none focus:border-red-600/50 transition-all uppercase placeholder:opacity-20" /></div>
        <div className="space-y-4"><label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-4 italic">Internal Intelligence Integration</label><textarea value={companyNews} onChange={e => setCompanyNews(e.target.value)} placeholder="ADD INTERNAL INSIGHTS..." rows={3} className="w-full bg-slate-900/30 border border-white/10 rounded-[32px] px-8 py-6 text-lg font-bold text-slate-400 outline-none focus:border-red-600/50 transition-all placeholder:opacity-20" /></div>
        <div className="space-y-4"><label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-4">Temporal Schedule</label><input type="datetime-local" value={publishDate} onChange={e => setPublishDate(e.target.value)} className="w-full bg-slate-900/30 border border-white/10 rounded-[32px] px-8 py-6 text-white font-black outline-none focus:border-red-600/50" /></div>
      </div>
      <button onClick={handleOrchestrate} disabled={loading || !topic} className={`w-full py-10 text-white rounded-[40px] font-black text-3xl shadow-5xl uppercase tracking-widest italic flex items-center justify-center gap-4 group disabled:opacity-30 ${buttonClass}`}>{loading ? <Loader2 className="animate-spin" size={32} /> : <Zap size={32} />} Orchestrate Narrative</button>
    </div>
  );
};

const ScheduleView: React.FC<{ posts: ContentPost[], onManagePost: (p: ContentPost) => void, profile: AppProfile }> = ({ posts, onManagePost, profile }) => (
  <div className="space-y-6">{posts.length === 0 && <div className="p-20 text-center text-slate-700 font-black uppercase text-2xl opacity-20 italic">Trajectory null.</div>}{posts.map(p => <div key={p.id} onClick={() => onManagePost(p)} className="bg-slate-900/30 border border-white/5 p-8 rounded-[40px] flex items-center justify-between hover:bg-white/5 cursor-pointer transition-all group shadow-xl"><div className="flex items-center gap-8"><div className="w-20 h-20 rounded-3xl overflow-hidden border border-white/10 shadow-lg bg-black"><img src={p.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" /></div><div><h4 className="font-black text-white text-2xl uppercase italic group-hover:text-red-500 transition-colors leading-tight">{p.title}</h4><div className="flex gap-4 items-center mt-2"><span className="text-[10px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-2 opacity-60"><Clock size={12} /> {new Date(p.publishedAt || p.scheduledDate).toLocaleString()}</span><span className={`px-4 py-0.5 rounded-full text-[9px] font-black uppercase border transition-all ${p.status === PostStatus.LIVE ? 'text-green-500 border-green-500/20' : 'text-red-500 border-red-500/20'}`}>{p.status === PostStatus.LIVE ? 'LIVE' : 'SCHEDULED'}</span><span className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/5 text-slate-500">{p.contentType}</span></div></div></div><div className="p-4 bg-white/5 text-slate-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-all shadow-lg"><Eye /></div></div>)}</div>
);

const SettingsView: React.FC<{ creds: Credentials, setCreds: (c: Credentials) => void, profile: AppProfile, onChangeProfile: (id: string) => void }> = ({ creds, setCreds, profile, onChangeProfile }) => (
  <div className="max-w-4xl space-y-12 animate-in fade-in duration-500">
    <div className="bg-slate-900/30 border border-white/5 p-12 rounded-[50px] space-y-8 backdrop-blur-3xl shadow-2xl">
      <div className="flex items-center gap-4 text-purple-500"><Layers /><h4 className="text-2xl font-black text-white uppercase italic">MEGS Identity Matrix</h4></div>
      <div className="grid grid-cols-2 gap-4">
        {Object.values(PROFILES).map(p => (
          <button
            key={p.id}
            onClick={() => onChangeProfile(p.id)}
            className={`p-6 rounded-3xl border text-left transition-all ${profile.id === p.id ? 'bg-white/10 border-white text-white' : 'bg-transparent border-white/5 text-slate-500 hover:text-white hover:border-white/20'}`}
          >
            <div className="text-xl font-black uppercase italic mb-1">{p.appName}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">{p.appDescription}</div>
          </button>
        ))}
      </div>
    </div>

    <div className="bg-slate-900/30 border border-white/5 p-12 rounded-[50px] space-y-8 backdrop-blur-3xl shadow-2xl">
      <div className="flex items-center gap-4 text-red-500"><Globe /><h4 className="text-2xl font-black text-white uppercase italic">Platform Sync Protocol</h4></div>
      <div className="space-y-4"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Secure Master API Key (Teknowguy)</label><input type="text" value={creds.blogApiKey} onChange={e => setCreds({ ...creds, blogApiKey: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-3xl px-8 py-6 text-white font-mono focus:border-red-600/50 outline-none" /></div>
      <div className="space-y-4"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Gemini API Key (AI Studio)</label><input type="password" placeholder="... KEY ..." value={creds.geminiApiKey || ''} onChange={e => setCreds({ ...creds, geminiApiKey: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-3xl px-8 py-6 text-white font-mono focus:border-red-600/50 outline-none" /></div>
    </div>

    <div className="bg-slate-900/30 border border-white/5 p-12 rounded-[50px] space-y-8 backdrop-blur-3xl shadow-2xl"><div className="flex items-center gap-4 text-blue-500"><Facebook /><h4 className="text-2xl font-black text-white uppercase italic">Meta Broadcast Uplink</h4></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-4"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Meta Page ID</label><input type="text" value={creds.facebookPageId} onChange={e => setCreds({ ...creds, facebookPageId: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-3xl px-8 py-6 text-white font-mono focus:border-red-600/50 outline-none" /></div><div className="space-y-4"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Access Credential</label><input type="password" value={creds.facebookAccessToken} onChange={e => setCreds({ ...creds, facebookAccessToken: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-3xl px-8 py-6 text-white font-mono focus:border-red-600/50 outline-none" /></div></div></div>
  </div>
);

const SidebarItem: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void, colorClass: string }> = ({ icon, label, active, onClick, colorClass }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${active ? `${colorClass} text-white shadow-xl shadow-red-600/30` : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>{icon} <span className="text-[13px] font-black uppercase tracking-tighter">{label}</span></button>
);

export default App;
