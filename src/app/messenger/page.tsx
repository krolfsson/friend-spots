"use client"

import { useState, useRef, useCallback } from 'react'

/* ─────────────────────── TYPES ─────────────────────── */

interface Participant {
  id: string
  name: string
  color: string
  avatar: string | null
  isMe: boolean
}

interface Reaction {
  emoji: string
  participantId: string
}

interface MessageEvent {
  id: string
  kind: 'message'
  senderId: string
  text: string
  imageUrl: string | null
  timestamp: string
  reactions: Reaction[]
  seenBy: string[]
}

interface SystemEvent {
  id: string
  kind: 'system'
  text: string
  timestamp: string
}

type ConversationEvent = MessageEvent | SystemEvent

/* ─────────────────────── CONSTANTS ─────────────────────── */

const PALETTE = [
  '#E53935', '#8E24AA', '#1565C0', '#00695C',
  '#2E7D32', '#E65100', '#AD1457', '#455A64',
]
let _ctr = 0
const uid = () => `id${++_ctr}${Math.random().toString(36).slice(2, 5)}`

/* ─────────────────────── ICONS ─────────────────────── */

const IcoPhone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#e4e6eb">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02L6.62 10.79z"/>
  </svg>
)
const IcoVideo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#e4e6eb">
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
  </svg>
)
const IcoInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#e4e6eb">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>
)
const IcoPlus = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#0A7CFF">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
  </svg>
)
const IcoImage = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#0A7CFF">
    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
  </svg>
)
const IcoGif = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#0A7CFF">
    <path d="M11.5 9H13v6h-1.5zM9 9H6c-.6 0-1 .5-1 1v4c0 .5.4 1 1 1h3c.6 0 1-.5 1-1v-2H8.5v1.5h-2v-3H10V10c0-.5-.4-1-1-1zm10 1.5V9h-4.5v6H16v-2h2v-1.5h-2v-1z"/>
  </svg>
)
const IcoSticker = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#0A7CFF">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
  </svg>
)
const IcoEmoji = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#0A7CFF">
    <path d="M12 2C6.47 2 2 6.48 2 12s4.47 10 10 10 10-4.47 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-3.5-9c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm7 0c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
  </svg>
)
const IcoLike = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#0A7CFF">
    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/>
  </svg>
)

/* ─────────────────────── AVATAR ─────────────────────── */

function Avatar({ p, size = 28, ring = false }: { p: Participant; size?: number; ring?: boolean }) {
  const initials = p.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const style: React.CSSProperties = {
    width: size, height: size, borderRadius: '50%',
    flexShrink: 0, display: 'block',
    ...(ring ? { border: '2px solid #0e0e0e', boxSizing: 'border-box' } : {}),
  }
  if (p.avatar) {
    return <img src={p.avatar} alt={p.name} style={{ ...style, objectFit: 'cover' }} />
  }
  return (
    <div style={{
      ...style,
      background: p.color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.38), fontWeight: 700,
      userSelect: 'none',
    }}>
      {initials}
    </div>
  )
}

/* ─────────────────────── MESSENGER PREVIEW ─────────────────────── */

function MessengerPreview({
  participants, events, conversationName,
}: {
  participants: Participant[]
  events: ConversationEvent[]
  conversationName: string
}) {
  const findP = useCallback((id: string) => participants.find(p => p.id === id), [participants])
  const others = participants.filter(p => !p.isMe)
  const isGroup = participants.length > 2 || others.length > 1

  const displayName =
    conversationName.trim() ||
    (others.length === 0 ? 'Konversation' :
     others.length === 1 ? others[0].name :
     others.map(p => p.name.split(' ')[0]).join(', '))

  const headerPeople = others.length > 0 ? others : participants

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      background: '#0e0e0e',
    }}>

      {/* ── HEADER ── */}
      <div style={{
        background: '#1c1c1c', borderBottom: '1px solid #2a2a2a',
        display: 'flex', alignItems: 'center', padding: '8px 16px',
        gap: 10, minHeight: 60, flexShrink: 0,
      }}>
        <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
          {headerPeople.length === 1 ? (
            <>
              <Avatar p={headerPeople[0]} size={40} />
              {!isGroup && (
                <div style={{
                  position: 'absolute', bottom: 1, right: 1,
                  width: 11, height: 11, borderRadius: '50%',
                  background: '#31a24c', border: '2.5px solid #1c1c1c',
                }} />
              )}
            </>
          ) : (
            <>
              <div style={{ position: 'absolute', bottom: 0, left: 0 }}>
                <Avatar p={headerPeople[0]} size={28} ring />
              </div>
              <div style={{ position: 'absolute', top: 0, right: 0 }}>
                <Avatar p={headerPeople[1] ?? headerPeople[0]} size={28} ring />
              </div>
            </>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: '#e4e6eb', fontWeight: 700, fontSize: 15,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </div>
          <div style={{ color: '#b0b3b8', fontSize: 12, marginTop: 1 }}>
            {isGroup ? `${participants.length} deltagare` : 'Aktiv nu'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 2 }}>
          {[IcoPhone, IcoVideo, IcoInfo].map((Ico, i) => (
            <div key={i} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#3a3b3c',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Ico />
            </div>
          ))}
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 8px',
        display: 'flex', flexDirection: 'column', gap: 1,
        scrollbarWidth: 'thin', scrollbarColor: '#3a3b3c transparent',
      }}>
        {events.length === 0 && (
          <div style={{
            color: '#65676b', textAlign: 'center',
            padding: '60px 20px', fontSize: 14,
          }}>
            Inga meddelanden ännu
          </div>
        )}

        {events.map((ev, idx) => {
          /* ── SYSTEM EVENT ── */
          if (ev.kind === 'system') {
            return (
              <div key={ev.id} style={{ textAlign: 'center', padding: '10px 24px' }}>
                {ev.timestamp && (
                  <div style={{ color: '#65676b', fontSize: 11, marginBottom: 4 }}>
                    {ev.timestamp}
                  </div>
                )}
                <div style={{ color: '#b0b3b8', fontSize: 12 }}>{ev.text}</div>
              </div>
            )
          }

          /* ── MESSAGE EVENT ── */
          const msg = ev as MessageEvent
          const sender = findP(msg.senderId)
          if (!sender) return null

          const isMe = sender.isMe
          const prev = events[idx - 1]
          const next = events[idx + 1]
          const prevSame = prev?.kind === 'message' && (prev as MessageEvent).senderId === msg.senderId
          const nextSame = next?.kind === 'message' && (next as MessageEvent).senderId === msg.senderId
          const isFirst = !prevSame
          const isLast = !nextSame

          // Border radius – Messenger bubble cluster style
          let br: string
          if (isMe) {
            if (isFirst && isLast)  br = '18px 18px 4px 18px'
            else if (isFirst)       br = '18px 18px 4px 18px'
            else if (isLast)        br = '18px 4px 18px 18px'
            else                    br = '18px 4px 4px 18px'
          } else {
            if (isFirst && isLast)  br = '18px 18px 18px 4px'
            else if (isFirst)       br = '18px 18px 18px 4px'
            else if (isLast)        br = '4px 18px 18px 18px'
            else                    br = '4px 18px 18px 4px'
          }

          // Grouped reactions by emoji
          const reactionMap: Record<string, number> = {}
          msg.reactions.forEach(r => {
            reactionMap[r.emoji] = (reactionMap[r.emoji] ?? 0) + 1
          })

          return (
            <div key={ev.id} style={{
              display: 'flex',
              flexDirection: isMe ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: 6,
              marginTop: isFirst ? 8 : 1,
              paddingLeft: isMe ? 60 : 0,
              paddingRight: isMe ? 0 : 60,
            }}>
              {/* Avatar (left side only) */}
              {!isMe && (
                <div style={{ width: 28, flexShrink: 0, alignSelf: 'flex-end', marginBottom: Object.keys(reactionMap).length > 0 ? 22 : 0 }}>
                  {isLast ? <Avatar p={sender} size={28} /> : <div style={{ width: 28 }} />}
                </div>
              )}

              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '65%',
                position: 'relative',
              }}>
                {/* Sender name (group chats, first in group, not me) */}
                {!isMe && isFirst && isGroup && (
                  <div style={{ color: '#b0b3b8', fontSize: 11, marginBottom: 3, marginLeft: 4 }}>
                    {sender.name}
                  </div>
                )}

                {/* Bubble */}
                <div style={{
                  ...(isMe
                    ? { background: 'linear-gradient(135deg, #0A7CFF 0%, #B100FE 100%)', color: '#fff' }
                    : { background: '#3a3b3c', color: '#e4e6eb' }
                  ),
                  borderRadius: br,
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  lineHeight: 1.4,
                  fontSize: 15,
                  maxWidth: '100%',
                }}>
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt=""
                      style={{
                        maxWidth: 260, maxHeight: 320, display: 'block',
                        borderRadius: msg.text ? '0' : '0',
                      }}
                    />
                  )}
                  {msg.text && (
                    <div style={{ padding: msg.imageUrl ? '8px 12px 8px' : '8px 12px' }}>
                      {msg.text}
                    </div>
                  )}
                </div>

                {/* Reactions */}
                {Object.keys(reactionMap).length > 0 && (
                  <div style={{
                    display: 'flex', gap: 3, marginTop: 3,
                    flexWrap: 'wrap',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    marginRight: isMe ? 4 : 0,
                    marginLeft: isMe ? 0 : 4,
                  }}>
                    {Object.entries(reactionMap).map(([emoji, count]) => (
                      <div key={emoji} style={{
                        background: '#2a2a2a',
                        border: '1.5px solid #1a1a1a',
                        borderRadius: 14, padding: '2px 7px',
                        fontSize: 13, display: 'flex', alignItems: 'center', gap: 3,
                        color: '#e4e6eb',
                      }}>
                        {emoji}{count > 1 && <span style={{ fontSize: 11 }}>{count}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Timestamp + seen */}
                {(msg.timestamp || (isLast && msg.seenBy.length > 0)) && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    marginTop: 3, color: '#65676b', fontSize: 11,
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    paddingRight: isMe ? 2 : 0, paddingLeft: isMe ? 0 : 2,
                  }}>
                    {msg.timestamp && <span>{msg.timestamp}</span>}
                    {msg.seenBy.length > 0 && (
                      <div style={{ display: 'flex', gap: 1 }}>
                        {msg.seenBy.map(pid => {
                          const sp = findP(pid)
                          return sp ? <Avatar key={pid} p={sp} size={12} /> : null
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── INPUT BAR (decorative) ── */}
      <div style={{
        background: '#1c1c1c', borderTop: '1px solid #2a2a2a',
        padding: '8px 12px',
        display: 'flex', alignItems: 'center', gap: 7,
        flexShrink: 0,
      }}>
        <IcoPlus /><IcoImage /><IcoGif /><IcoSticker /><IcoEmoji />
        <div style={{
          flex: 1, background: '#3a3b3c', borderRadius: 20,
          padding: '8px 16px', color: '#65676b', fontSize: 15,
        }}>
          Aa
        </div>
        <IcoLike />
      </div>
    </div>
  )
}

/* ─────────────────────── MAIN PAGE ─────────────────────── */

export default function MessengerMockPage() {
  const [conversationName, setConversationName] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'me', name: 'Du', color: '#1565C0', avatar: null, isMe: true },
    { id: uid(), name: 'Anna Svensson', color: '#E53935', avatar: null, isMe: false },
  ])
  const [events, setEvents] = useState<ConversationEvent[]>([])
  const [activeTab, setActiveTab] = useState<'participants' | 'events'>('events')
  const [previewOnly, setPreviewOnly] = useState(false)

  // New message state
  const [newKind, setNewKind] = useState<'message' | 'system'>('message')
  const [newSenderId, setNewSenderId] = useState('me')
  const [newText, setNewText] = useState('')
  const [newImage, setNewImage] = useState<string | null>(null)
  const [newTimestamp, setNewTimestamp] = useState('')
  const [newReactions, setNewReactions] = useState<Reaction[]>([])
  const [newSeenBy, setNewSeenBy] = useState<string[]>([])
  const [systemText, setSystemText] = useState('')
  const [systemTimestamp, setSystemTimestamp] = useState('')

  // New participant state
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PALETTE[1])

  const imageRef = useRef<HTMLInputElement>(null)
  const avatarRef = useRef<HTMLInputElement>(null)
  const [editingAvatarId, setEditingAvatarId] = useState<string | null>(null)

  const me = participants.find(p => p.isMe)
  const others = participants.filter(p => !p.isMe)

  const systemTemplates = [
    `${me?.name ?? 'Du'} lade till ${others[0]?.name ?? 'någon'} i konversationen`,
    `${others[0]?.name ?? 'Någon'} lämnade konversationen`,
    `${me?.name ?? 'Du'} tog bort ${others[0]?.name ?? 'någon'} ur konversationen`,
    `Konversationsnamnet ändrades till "${conversationName || 'Ny konversation'}"`,
    `${me?.name ?? 'Du'} bytte konversationens bild`,
    `${others[0]?.name ?? 'Någon'} lade till ${others[1]?.name ?? 'någon annan'} i konversationen`,
  ]

  const canAddEvent =
    newKind === 'message' ? (newText.trim().length > 0 || newImage !== null) : systemText.trim().length > 0

  function addEvent() {
    if (!canAddEvent) return
    if (newKind === 'message') {
      const ev: MessageEvent = {
        id: uid(), kind: 'message',
        senderId: newSenderId,
        text: newText.trim(),
        imageUrl: newImage,
        timestamp: newTimestamp.trim(),
        reactions: [...newReactions],
        seenBy: [...newSeenBy],
      }
      setEvents(prev => [...prev, ev])
      setNewText(''); setNewImage(null); setNewTimestamp('')
      setNewReactions([]); setNewSeenBy([])
    } else {
      const ev: SystemEvent = {
        id: uid(), kind: 'system',
        text: systemText.trim(), timestamp: systemTimestamp.trim(),
      }
      setEvents(prev => [...prev, ev])
      setSystemText(''); setSystemTimestamp('')
    }
  }

  function addParticipant() {
    if (!newName.trim()) return
    setParticipants(prev => [...prev, {
      id: uid(), name: newName.trim(),
      color: newColor, avatar: null, isMe: false,
    }])
    setNewName('')
    const nextIdx = (participants.length) % PALETTE.length
    setNewColor(PALETTE[nextIdx])
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setNewImage(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !editingAvatarId) return
    const reader = new FileReader()
    reader.onload = ev => {
      setParticipants(prev => prev.map(p =>
        p.id === editingAvatarId ? { ...p, avatar: ev.target?.result as string } : p
      ))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
    setEditingAvatarId(null)
  }

  function toggleReaction(emoji: string) {
    const defaultReactor = others[0]?.id ?? 'me'
    setNewReactions(prev =>
      prev.some(r => r.emoji === emoji)
        ? prev.filter(r => r.emoji !== emoji)
        : [...prev, { emoji, participantId: defaultReactor }]
    )
  }

  function toggleSeen(pid: string) {
    setNewSeenBy(prev => prev.includes(pid) ? prev.filter(x => x !== pid) : [...prev, pid])
  }

  const inputStyle: React.CSSProperties = {
    background: '#3a3b3c', border: 'none', borderRadius: 8,
    padding: '8px 12px', color: '#e4e6eb', fontSize: 14,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    color: '#b0b3b8', fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4,
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', background: '#18191a', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    }}>
      {/* Hidden file inputs */}
      <input ref={imageRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
      <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />

      {/* ════════════ EDITOR PANEL ════════════ */}
      {!previewOnly && (
        <div style={{
          width: 380, flexShrink: 0, background: '#242526',
          borderRight: '1px solid #3a3b3c',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #3a3b3c' }}>
            <div style={{ color: '#e4e6eb', fontWeight: 700, fontSize: 17, marginBottom: 10 }}>
              💬 Messenger Mockup
            </div>
            <div style={{ ...labelStyle, marginBottom: 4 }}>Konversationsnamn</div>
            <input
              type="text"
              placeholder="T.ex. Gänget 🎉"
              value={conversationName}
              onChange={e => setConversationName(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #3a3b3c', flexShrink: 0 }}>
            {(['participants', 'events'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: '10px 0', border: 'none', background: 'transparent',
                color: activeTab === tab ? '#0A7CFF' : '#b0b3b8',
                fontWeight: activeTab === tab ? 700 : 400, fontSize: 14, cursor: 'pointer',
                borderBottom: `2px solid ${activeTab === tab ? '#0A7CFF' : 'transparent'}`,
              }}>
                {tab === 'participants' ? `👥 Deltagare (${participants.length})` : `💬 Händelser (${events.length})`}
              </button>
            ))}
          </div>

          {/* Tab body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px' }}>

            {/* ── PARTICIPANTS ── */}
            {activeTab === 'participants' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {participants.map(p => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#3a3b3c', borderRadius: 10, padding: '10px 12px',
                  }}>
                    <button
                      onClick={() => { setEditingAvatarId(p.id); avatarRef.current?.click() }}
                      title="Klicka för att ladda upp foto"
                      style={{
                        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                        borderRadius: '50%', overflow: 'hidden',
                      }}
                    >
                      <Avatar p={p} size={38} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#e4e6eb', fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.name}
                        {p.isMe && (
                          <span style={{
                            background: '#0A7CFF', color: '#fff', borderRadius: 4,
                            fontSize: 10, padding: '1px 5px', fontWeight: 700,
                          }}>Du</span>
                        )}
                      </div>
                      <div style={{ color: '#65676b', fontSize: 11, marginTop: 1 }}>
                        Klicka på bilden för att byta foto
                      </div>
                    </div>
                    {!p.isMe && (
                      <button
                        onClick={() => {
                          setParticipants(prev => prev.filter(x => x.id !== p.id))
                          setEvents(prev => prev.filter(ev =>
                            ev.kind !== 'message' || (ev as MessageEvent).senderId !== p.id
                          ))
                          if (newSenderId === p.id) setNewSenderId('me')
                        }}
                        style={{
                          background: 'none', border: 'none', color: '#65676b',
                          fontSize: 15, cursor: 'pointer', padding: '2px 4px',
                        }}
                        title="Ta bort"
                      >✕</button>
                    )}
                  </div>
                ))}

                {/* Add participant */}
                <div style={{
                  background: '#3a3b3c', borderRadius: 10, padding: 12,
                  display: 'flex', flexDirection: 'column', gap: 8,
                  border: '1px dashed #555',
                }}>
                  <div style={labelStyle}>Lägg till deltagare</div>
                  <input
                    type="text"
                    placeholder="Namn"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addParticipant()}
                    style={{ ...inputStyle, background: '#18191a' }}
                  />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ color: '#b0b3b8', fontSize: 12 }}>Färg:</span>
                    {PALETTE.map(c => (
                      <button
                        key={c}
                        onClick={() => setNewColor(c)}
                        style={{
                          width: 22, height: 22, borderRadius: '50%', background: c,
                          border: newColor === c ? '2.5px solid #e4e6eb' : '2.5px solid transparent',
                          cursor: 'pointer', padding: 0,
                        }}
                      />
                    ))}
                  </div>
                  <button onClick={addParticipant} style={{
                    background: '#0A7CFF', border: 'none', borderRadius: 8,
                    padding: '8px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>
                    + Lägg till
                  </button>
                </div>
              </div>
            )}

            {/* ── EVENTS ── */}
            {activeTab === 'events' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Kind toggle */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['message', 'system'] as const).map(k => (
                    <button key={k} onClick={() => setNewKind(k)} style={{
                      flex: 1, padding: '7px', borderRadius: 8, border: 'none',
                      background: newKind === k ? '#0A7CFF' : '#3a3b3c',
                      color: '#e4e6eb', fontSize: 13,
                      fontWeight: newKind === k ? 700 : 400, cursor: 'pointer',
                    }}>
                      {k === 'message' ? '💬 Meddelande' : '⚙️ Systemevent'}
                    </button>
                  ))}
                </div>

                {newKind === 'message' ? (
                  <>
                    {/* Sender */}
                    <div>
                      <div style={labelStyle}>Avsändare</div>
                      <select
                        value={newSenderId}
                        onChange={e => setNewSenderId(e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        {participants.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name}{p.isMe ? ' (Du)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Text */}
                    <div>
                      <div style={labelStyle}>Meddelande</div>
                      <textarea
                        placeholder="Skriv ett meddelande..."
                        value={newText}
                        onChange={e => setNewText(e.target.value)}
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                      />
                    </div>

                    {/* Image */}
                    <div>
                      <div style={labelStyle}>Bild (valfritt)</div>
                      {newImage ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={newImage} alt=""
                            style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 8, display: 'block' }}
                          />
                          <button
                            onClick={() => setNewImage(null)}
                            style={{
                              position: 'absolute', top: 4, right: 4,
                              background: 'rgba(0,0,0,0.75)', border: 'none', borderRadius: '50%',
                              width: 22, height: 22, color: '#fff', cursor: 'pointer',
                              fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => imageRef.current?.click()}
                          style={{
                            width: '100%', background: '#3a3b3c',
                            border: '1.5px dashed #65676b',
                            borderRadius: 8, padding: '10px', color: '#b0b3b8',
                            fontSize: 13, cursor: 'pointer',
                          }}
                        >
                          📎 Välj bild
                        </button>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div>
                      <div style={labelStyle}>Tid (valfritt)</div>
                      <input
                        type="text"
                        placeholder="T.ex. 14:23 eller Igår 09:15"
                        value={newTimestamp}
                        onChange={e => setNewTimestamp(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    {/* Reactions */}
                    <div>
                      <div style={labelStyle}>Reaktioner</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {['❤️', '😆', '😮', '😢', '😠', '👍', '🔥', '🎉'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(emoji)}
                            style={{
                              background: newReactions.some(r => r.emoji === emoji) ? '#0A7CFF44' : '#3a3b3c',
                              border: newReactions.some(r => r.emoji === emoji) ? '1.5px solid #0A7CFF' : '1.5px solid transparent',
                              borderRadius: 8, padding: '4px 8px',
                              fontSize: 18, cursor: 'pointer',
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Seen by */}
                    {others.length > 0 && (
                      <div>
                        <div style={labelStyle}>Sett av</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {others.map(p => (
                            <button
                              key={p.id}
                              onClick={() => toggleSeen(p.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                background: newSeenBy.includes(p.id) ? '#0A7CFF33' : '#3a3b3c',
                                border: `1.5px solid ${newSeenBy.includes(p.id) ? '#0A7CFF' : 'transparent'}`,
                                borderRadius: 20, padding: '4px 8px 4px 4px',
                                cursor: 'pointer',
                              }}
                            >
                              <Avatar p={p} size={18} />
                              <span style={{ color: '#e4e6eb', fontSize: 12 }}>{p.name.split(' ')[0]}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* System templates */}
                    <div>
                      <div style={labelStyle}>Mallar</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {systemTemplates.map((tmpl, i) => (
                          <button
                            key={i}
                            onClick={() => setSystemText(tmpl)}
                            style={{
                              background: systemText === tmpl ? '#0A7CFF22' : '#3a3b3c',
                              border: `1px solid ${systemText === tmpl ? '#0A7CFF' : 'transparent'}`,
                              borderRadius: 8, padding: '7px 10px',
                              color: '#b0b3b8', fontSize: 12, cursor: 'pointer', textAlign: 'left',
                            }}
                          >
                            {tmpl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={labelStyle}>Eller skriv eget</div>
                      <textarea
                        placeholder="Eget systemmeddelande..."
                        value={systemText}
                        onChange={e => setSystemText(e.target.value)}
                        rows={2}
                        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                      />
                    </div>

                    <div>
                      <div style={labelStyle}>Tid (valfritt)</div>
                      <input
                        type="text"
                        placeholder="T.ex. Idag 15:00"
                        value={systemTimestamp}
                        onChange={e => setSystemTimestamp(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </>
                )}

                {/* Add button */}
                <button
                  onClick={addEvent}
                  disabled={!canAddEvent}
                  style={{
                    background: canAddEvent ? '#0A7CFF' : '#3a3b3c',
                    border: 'none', borderRadius: 10, padding: '11px',
                    color: canAddEvent ? '#fff' : '#65676b',
                    fontSize: 14, fontWeight: 700, cursor: canAddEvent ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                  }}
                >
                  ➕ Lägg till i konversationen
                </button>

                {/* Event list */}
                {events.length > 0 && (
                  <>
                    <div style={{ ...labelStyle, marginTop: 8 }}>
                      Händelsehistorik ({events.length} st)
                    </div>
                    {events.map((ev, i) => {
                      const isMsg = ev.kind === 'message'
                      const msg = ev as MessageEvent
                      const senderName = isMsg ? (participants.find(p => p.id === msg.senderId)?.name ?? '?') : ''
                      return (
                        <div key={ev.id} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: '#3a3b3c', borderRadius: 8, padding: '7px 10px',
                        }}>
                          <div style={{ fontSize: 14 }}>{isMsg ? '💬' : '⚙️'}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {isMsg ? (
                              <>
                                <div style={{ color: '#65676b', fontSize: 10 }}>{senderName}</div>
                                <div style={{
                                  color: '#e4e6eb', fontSize: 12,
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {msg.imageUrl && !msg.text ? '📷 Bild' : msg.text}
                                </div>
                              </>
                            ) : (
                              <div style={{
                                color: '#b0b3b8', fontSize: 12,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {(ev as SystemEvent).text}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {/* Move up */}
                            {i > 0 && (
                              <button
                                onClick={() => {
                                  setEvents(prev => {
                                    const a = [...prev]
                                    ;[a[i - 1], a[i]] = [a[i], a[i - 1]]
                                    return a
                                  })
                                }}
                                style={{ background: 'none', border: 'none', color: '#b0b3b8', cursor: 'pointer', fontSize: 12, padding: 2 }}
                                title="Flytta upp"
                              >↑</button>
                            )}
                            {/* Move down */}
                            {i < events.length - 1 && (
                              <button
                                onClick={() => {
                                  setEvents(prev => {
                                    const a = [...prev]
                                    ;[a[i], a[i + 1]] = [a[i + 1], a[i]]
                                    return a
                                  })
                                }}
                                style={{ background: 'none', border: 'none', color: '#b0b3b8', cursor: 'pointer', fontSize: 12, padding: 2 }}
                                title="Flytta ner"
                              >↓</button>
                            )}
                            <button
                              onClick={() => setEvents(prev => prev.filter(e => e.id !== ev.id))}
                              style={{ background: 'none', border: 'none', color: '#65676b', cursor: 'pointer', fontSize: 14, padding: 2 }}
                              title="Ta bort"
                            >✕</button>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Screenshot mode button */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid #3a3b3c', flexShrink: 0 }}>
            <button
              onClick={() => setPreviewOnly(true)}
              style={{
                width: '100%', background: '#3a3b3c', border: 'none',
                borderRadius: 8, padding: '9px', color: '#e4e6eb',
                fontSize: 13, cursor: 'pointer', fontWeight: 500,
              }}
            >
              📸 Skärmbildsläge – dölj redigeraren
            </button>
          </div>
        </div>
      )}

      {/* ════════════ PREVIEW PANEL ════════════ */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', position: 'relative',
        background: previewOnly ? '#0e0e0e' : '#18191a',
      }}>
        {previewOnly && (
          <button
            onClick={() => setPreviewOnly(false)}
            style={{
              position: 'absolute', top: 12, left: 12, zIndex: 10,
              background: 'rgba(30,30,30,0.85)', backdropFilter: 'blur(4px)',
              border: '1px solid #3a3b3c', borderRadius: 8,
              padding: '6px 14px', color: '#e4e6eb', fontSize: 12,
              cursor: 'pointer', fontWeight: 500,
            }}
          >
            ← Redigera
          </button>
        )}

        <div style={{
          flex: 1, display: 'flex',
          justifyContent: previewOnly ? 'center' : 'center',
          padding: previewOnly ? 0 : '16px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: '100%',
            maxWidth: previewOnly ? '100%' : 820,
            height: '100%',
            borderRadius: previewOnly ? 0 : 10,
            overflow: 'hidden',
            border: previewOnly ? 'none' : '1px solid #2a2a2a',
          }}>
            <MessengerPreview
              participants={participants}
              events={events}
              conversationName={conversationName}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
