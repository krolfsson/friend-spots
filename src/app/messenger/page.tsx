"use client"

import Image from "next/image"
import { useState, useRef, useCallback } from "react"

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

const IcoPhone = ({ color = '#1c1e21' }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02L6.62 10.79z"/>
  </svg>
)
const IcoVideo = ({ color = '#1c1e21' }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
  </svg>
)
const IcoInfo = ({ color = '#1c1e21' }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>
)
const IcoPlus = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#0A7CFF">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
  </svg>
)
const IcoImage = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#0A7CFF">
    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
  </svg>
)
const IcoGif = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#0A7CFF">
    <path d="M11.5 9H13v6h-1.5zM9 9H6c-.6 0-1 .5-1 1v4c0 .5.4 1 1 1h3c.6 0 1-.5 1-1v-2H8.5v1.5h-2v-3H10V10c0-.5-.4-1-1-1zm10 1.5V9h-4.5v6H16v-2h2v-1.5h-2v-1z"/>
  </svg>
)
const IcoMic = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#0A7CFF">
    <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.42 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
  </svg>
)
const IcoLike = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="#0A7CFF">
    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/>
  </svg>
)

/* ─────────────────────── AVATAR ─────────────────────── */

function Avatar({ p, size = 28, ring = false, ringColor = '#fff' }: {
  p: Participant; size?: number; ring?: boolean; ringColor?: string
}) {
  const initials = p.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const base: React.CSSProperties = {
    width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'block',
    ...(ring ? { border: `2px solid ${ringColor}`, boxSizing: 'border-box' } : {}),
  }
  if (p.avatar) {
    return (
      <Image
        src={p.avatar}
        alt={p.name}
        width={size}
        height={size}
        unoptimized
        style={{ ...base, objectFit: "cover" }}
      />
    )
  }
  return (
    <div style={{
      ...base,
      background: p.color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.38), fontWeight: 700, userSelect: 'none',
    }}>
      {initials}
    </div>
  )
}

/* ─────────────────────── STATUS BAR ─────────────────────── */

function StatusBar() {
  return (
    <div style={{
      height: 54, display: 'flex', alignItems: 'flex-end',
      justifyContent: 'space-between', padding: '0 30px 10px',
      background: '#fff', flexShrink: 0,
    }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#000', letterSpacing: '-0.3px' }}>
        9:41
      </span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {/* Signal bars */}
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
          <rect x="0" y="4" width="3" height="8" rx="1" fill="#000"/>
          <rect x="5" y="2.5" width="3" height="9.5" rx="1" fill="#000"/>
          <rect x="10" y="1" width="3" height="11" rx="1" fill="#000"/>
          <rect x="15" y="0" width="3" height="12" rx="1" fill="#000"/>
        </svg>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="#000">
          <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM1.54 5.29a9 9 0 0112.92 0l1.41-1.41A11 11 0 00.13 3.88L1.54 5.3zm2.83 2.83a5 5 0 017.26 0l1.41-1.41a7 7 0 00-10.08 0l1.41 1.41z"/>
        </svg>
        {/* Battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <div style={{
            width: 25, height: 12, border: '1.5px solid #000',
            borderRadius: 3, padding: 2, display: 'flex',
          }}>
            <div style={{ width: '80%', background: '#000', borderRadius: 1 }} />
          </div>
          <div style={{ width: 2, height: 6, background: '#000', borderRadius: '0 1px 1px 0' }} />
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────── HOME INDICATOR ─────────────────────── */

function HomeIndicator() {
  return (
    <div style={{
      height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#fff', flexShrink: 0,
    }}>
      <div style={{ width: 134, height: 5, background: '#000', borderRadius: 3, opacity: 0.18 }} />
    </div>
  )
}

/* ─────────────────────── IPHONE FRAME ─────────────────────── */

function IPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(145deg, #2a2a2a 0%, #111 50%, #1a1a1a 100%)',
      borderRadius: 56,
      padding: 13,
      boxShadow: [
        '0 0 0 1px #555',
        '0 0 0 1.5px #111',
        '0 40px 100px rgba(0,0,0,0.35)',
        'inset 0 1px 0 rgba(255,255,255,0.08)',
      ].join(', '),
      display: 'inline-block',
    }}>
      {/* Mute switch */}
      <div style={{
        position: 'absolute', left: -4, top: 108,
        width: 4, height: 28, background: '#333',
        borderRadius: '2px 0 0 2px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
      }} />
      {/* Volume up */}
      <div style={{
        position: 'absolute', left: -4, top: 152,
        width: 4, height: 52, background: '#333',
        borderRadius: '2px 0 0 2px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
      }} />
      {/* Volume down */}
      <div style={{
        position: 'absolute', left: -4, top: 218,
        width: 4, height: 52, background: '#333',
        borderRadius: '2px 0 0 2px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
      }} />
      {/* Power */}
      <div style={{
        position: 'absolute', right: -4, top: 162,
        width: 4, height: 72, background: '#333',
        borderRadius: '0 2px 2px 0',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
      }} />

      {/* Screen */}
      <div style={{
        width: 375, height: 812,
        borderRadius: 44,
        overflow: 'hidden',
        background: '#fff',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Dynamic Island */}
        <div style={{
          position: 'absolute', top: 12, left: '50%',
          transform: 'translateX(-50%)',
          width: 120, height: 34,
          background: '#000', borderRadius: 20,
          zIndex: 30, pointerEvents: 'none',
        }} />
        {children}
      </div>
    </div>
  )
}

/* ─────────────────────── MESSENGER PREVIEW (LIGHT MODE) ─────────────────────── */

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
      flex: 1, display: 'flex', flexDirection: 'column',
      minHeight: 0, overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      background: '#fff',
    }}>
      {/* ── HEADER ── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e4e6eb',
        display: 'flex', alignItems: 'center',
        padding: '8px 12px', gap: 8,
        minHeight: 56, flexShrink: 0,
      }}>
        {/* Back arrow */}
        <svg width="11" height="18" viewBox="0 0 11 18" fill="#0A7CFF">
          <path d="M10 1L2 9l8 8" stroke="#0A7CFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>

        {/* Avatar cluster */}
        <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
          {headerPeople.length === 1 ? (
            <>
              <Avatar p={headerPeople[0]} size={36} />
              {!isGroup && (
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 11, height: 11, borderRadius: '50%',
                  background: '#31a24c', border: '2px solid #fff',
                }} />
              )}
            </>
          ) : (
            <>
              <div style={{ position: 'absolute', bottom: 0, left: 0 }}>
                <Avatar p={headerPeople[0]} size={26} ring ringColor="#fff" />
              </div>
              <div style={{ position: 'absolute', top: 0, right: 0 }}>
                <Avatar p={headerPeople[1] ?? headerPeople[0]} size={26} ring ringColor="#fff" />
              </div>
            </>
          )}
        </div>

        {/* Name + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: '#050505', fontWeight: 700, fontSize: 14,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </div>
          <div style={{ color: '#65676b', fontSize: 11, marginTop: 1 }}>
            {isGroup ? `${participants.length} deltagare` : 'Aktiv nu'}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 2 }}>
          {[IcoPhone, IcoVideo, IcoInfo].map((Ico, i) => (
            <div key={i} style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#f0f2f5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Ico color="#0A7CFF" />
            </div>
          ))}
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '8px 8px 4px',
        display: 'flex', flexDirection: 'column', gap: 1,
        background: '#fff',
        minHeight: 0,
      }}>
        {events.length === 0 && (
          <div style={{
            color: '#b0b3b8', textAlign: 'center',
            padding: '50px 20px', fontSize: 13,
          }}>
            Inga meddelanden ännu
          </div>
        )}

        {events.map((ev, idx) => {
          /* ── SYSTEM EVENT ── */
          if (ev.kind === 'system') {
            return (
              <div key={ev.id} style={{ textAlign: 'center', padding: '8px 20px' }}>
                {ev.timestamp && (
                  <div style={{ color: '#b0b3b8', fontSize: 11, marginBottom: 3 }}>
                    {ev.timestamp}
                  </div>
                )}
                <div style={{ color: '#65676b', fontSize: 12 }}>{ev.text}</div>
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

          // Messenger bubble cluster border-radius
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

          const reactionMap: Record<string, number> = {}
          msg.reactions.forEach(r => { reactionMap[r.emoji] = (reactionMap[r.emoji] ?? 0) + 1 })

          return (
            <div key={ev.id} style={{
              display: 'flex',
              flexDirection: isMe ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: 5,
              marginTop: isFirst ? 6 : 1,
              paddingLeft: isMe ? 50 : 0,
              paddingRight: isMe ? 0 : 50,
            }}>
              {/* Avatar (left side) */}
              {!isMe && (
                <div style={{ width: 28, flexShrink: 0, alignSelf: 'flex-end' }}>
                  {isLast ? <Avatar p={sender} size={28} /> : <div style={{ width: 28 }} />}
                </div>
              )}

              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
              }}>
                {/* Sender name in group chats */}
                {!isMe && isFirst && isGroup && (
                  <div style={{ color: '#65676b', fontSize: 11, marginBottom: 2, marginLeft: 4 }}>
                    {sender.name}
                  </div>
                )}

                {/* Bubble */}
                <div style={{
                  ...(isMe
                    ? { background: 'linear-gradient(135deg, #0A7CFF 0%, #B100FE 100%)', color: '#fff' }
                    : { background: '#f0f0f0', color: '#050505' }
                  ),
                  borderRadius: br,
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  lineHeight: 1.4,
                  fontSize: 15,
                  maxWidth: '100%',
                }}>
                  {msg.imageUrl && (
                    <Image
                      src={msg.imageUrl}
                      alt=""
                      width={220}
                      height={280}
                      unoptimized
                      style={{ maxWidth: 220, maxHeight: 280, display: "block", width: "auto", height: "auto" }}
                    />
                  )}
                  {msg.text && (
                    <div style={{ padding: '8px 12px' }}>{msg.text}</div>
                  )}
                </div>

                {/* Reactions */}
                {Object.keys(reactionMap).length > 0 && (
                  <div style={{
                    display: 'flex', gap: 3, marginTop: 3,
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    marginRight: isMe ? 3 : 0,
                    marginLeft: isMe ? 0 : 3,
                  }}>
                    {Object.entries(reactionMap).map(([emoji, count]) => (
                      <div key={emoji} style={{
                        background: '#fff',
                        border: '1.5px solid #e4e6eb',
                        borderRadius: 14, padding: '2px 7px',
                        fontSize: 13, display: 'flex', alignItems: 'center', gap: 2,
                        color: '#050505',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }}>
                        {emoji}{count > 1 && <span style={{ fontSize: 11 }}>{count}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Timestamp + seen */}
                {(msg.timestamp || (isLast && msg.seenBy.length > 0)) && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4, marginTop: 3,
                    color: '#b0b3b8', fontSize: 11,
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    paddingRight: isMe ? 2 : 0,
                    paddingLeft: isMe ? 0 : 2,
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
        background: '#fff',
        borderTop: '1px solid #e4e6eb',
        padding: '8px 10px',
        display: 'flex', alignItems: 'center', gap: 5,
        flexShrink: 0,
      }}>
        <IcoPlus /><IcoImage /><IcoGif /><IcoMic />
        <div style={{
          flex: 1, background: '#f0f2f5', borderRadius: 20,
          padding: '7px 14px', color: '#b0b3b8', fontSize: 15,
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

  const canAdd =
    newKind === 'message' ? (newText.trim().length > 0 || newImage !== null) : systemText.trim().length > 0

  function addEvent() {
    if (!canAdd) return
    if (newKind === 'message') {
      const ev: MessageEvent = {
        id: uid(), kind: 'message',
        senderId: newSenderId, text: newText.trim(),
        imageUrl: newImage, timestamp: newTimestamp.trim(),
        reactions: [...newReactions], seenBy: [...newSeenBy],
      }
      setEvents(prev => [...prev, ev])
      setNewText(''); setNewImage(null); setNewTimestamp('')
      setNewReactions([]); setNewSeenBy([])
    } else {
      setEvents(prev => [...prev, {
        id: uid(), kind: 'system',
        text: systemText.trim(), timestamp: systemTimestamp.trim(),
      }])
      setSystemText(''); setSystemTimestamp('')
    }
  }

  function addParticipant() {
    if (!newName.trim()) return
    setParticipants(prev => [...prev, {
      id: uid(), name: newName.trim(), color: newColor, avatar: null, isMe: false,
    }])
    setNewName('')
    setNewColor(PALETTE[participants.length % PALETTE.length])
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
    const reactor = others[0]?.id ?? 'me'
    setNewReactions(prev =>
      prev.some(r => r.emoji === emoji)
        ? prev.filter(r => r.emoji !== emoji)
        : [...prev, { emoji, participantId: reactor }]
    )
  }

  function toggleSeen(pid: string) {
    setNewSeenBy(prev => prev.includes(pid) ? prev.filter(x => x !== pid) : [...prev, pid])
  }

  const inputCss: React.CSSProperties = {
    background: '#3a3b3c', border: 'none', borderRadius: 8,
    padding: '8px 12px', color: '#e4e6eb', fontSize: 14,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  }
  const labelCss: React.CSSProperties = {
    color: '#b0b3b8', fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4,
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      background: '#f0f2f5',
    }}>
      <input ref={imageRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
      <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />

      {/* ════════ EDITOR ════════ */}
      {!previewOnly && (
        <div style={{
          width: 380, flexShrink: 0, background: '#242526',
          borderRight: '1px solid #3a3b3c',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #3a3b3c' }}>
            <div style={{ color: '#e4e6eb', fontWeight: 700, fontSize: 17, marginBottom: 10 }}>
              💬 Messenger Mockup
            </div>
            <div style={labelCss}>Konversationsnamn</div>
            <input
              type="text" placeholder="T.ex. Gänget 🎉"
              value={conversationName} onChange={e => setConversationName(e.target.value)}
              style={inputCss}
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

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>

            {/* ── PARTICIPANTS TAB ── */}
            {activeTab === 'participants' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {participants.map(p => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#3a3b3c', borderRadius: 10, padding: '10px 12px',
                  }}>
                    <button
                      onClick={() => { setEditingAvatarId(p.id); avatarRef.current?.click() }}
                      title="Klicka för att byta foto"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      <Avatar p={p} size={38} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#e4e6eb', fontWeight: 500, fontSize: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
                        {p.name}
                        {p.isMe && (
                          <span style={{
                            background: '#0A7CFF', color: '#fff', borderRadius: 4,
                            fontSize: 10, padding: '1px 5px', fontWeight: 700,
                          }}>Du</span>
                        )}
                      </div>
                      <div style={{ color: '#65676b', fontSize: 11, marginTop: 1 }}>Klicka för att byta foto</div>
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
                        style={{ background: 'none', border: 'none', color: '#65676b', cursor: 'pointer', fontSize: 15, padding: '2px 4px' }}
                      >✕</button>
                    )}
                  </div>
                ))}

                <div style={{
                  background: '#3a3b3c', borderRadius: 10, padding: 12,
                  display: 'flex', flexDirection: 'column', gap: 8,
                  border: '1px dashed #555',
                }}>
                  <div style={labelCss}>Lägg till deltagare</div>
                  <input
                    type="text" placeholder="Namn" value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addParticipant()}
                    style={{ ...inputCss, background: '#18191a' }}
                  />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ color: '#b0b3b8', fontSize: 12 }}>Färg:</span>
                    {PALETTE.map(c => (
                      <button key={c} onClick={() => setNewColor(c)} style={{
                        width: 22, height: 22, borderRadius: '50%', background: c,
                        border: newColor === c ? '2.5px solid #e4e6eb' : '2.5px solid transparent',
                        cursor: 'pointer', padding: 0,
                      }} />
                    ))}
                  </div>
                  <button onClick={addParticipant} style={{
                    background: '#0A7CFF', border: 'none', borderRadius: 8,
                    padding: '8px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>+ Lägg till</button>
                </div>
              </div>
            )}

            {/* ── EVENTS TAB ── */}
            {activeTab === 'events' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                    <div>
                      <div style={labelCss}>Avsändare</div>
                      <select value={newSenderId} onChange={e => setNewSenderId(e.target.value)}
                        style={{ ...inputCss, cursor: 'pointer' }}>
                        {participants.map(p => (
                          <option key={p.id} value={p.id}>{p.name}{p.isMe ? ' (Du)' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div style={labelCss}>Meddelande</div>
                      <textarea
                        placeholder="Skriv ett meddelande..."
                        value={newText} onChange={e => setNewText(e.target.value)}
                        rows={3}
                        style={{ ...inputCss, resize: 'vertical', fontFamily: 'inherit' }}
                      />
                    </div>

                    <div>
                      <div style={labelCss}>Bild (valfritt)</div>
                      {newImage ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <Image
                            src={newImage}
                            alt=""
                            width={320}
                            height={120}
                            unoptimized
                            style={{ maxWidth: "100%", maxHeight: 120, borderRadius: 8, display: "block", width: "auto", height: "auto" }}
                          />
                          <button onClick={() => setNewImage(null)} style={{
                            position: 'absolute', top: 4, right: 4,
                            background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%',
                            width: 22, height: 22, color: '#fff', cursor: 'pointer', fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={() => imageRef.current?.click()} style={{
                          width: '100%', background: '#3a3b3c', border: '1.5px dashed #65676b',
                          borderRadius: 8, padding: '10px', color: '#b0b3b8', fontSize: 13, cursor: 'pointer',
                        }}>📎 Välj bild</button>
                      )}
                    </div>

                    <div>
                      <div style={labelCss}>Tid (valfritt)</div>
                      <input type="text" placeholder="T.ex. 14:23" value={newTimestamp}
                        onChange={e => setNewTimestamp(e.target.value)} style={inputCss} />
                    </div>

                    <div>
                      <div style={labelCss}>Reaktioner</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {['❤️', '😆', '😮', '😢', '😠', '👍', '🔥', '🎉'].map(emoji => (
                          <button key={emoji} onClick={() => toggleReaction(emoji)} style={{
                            background: newReactions.some(r => r.emoji === emoji) ? '#0A7CFF44' : '#3a3b3c',
                            border: `1.5px solid ${newReactions.some(r => r.emoji === emoji) ? '#0A7CFF' : 'transparent'}`,
                            borderRadius: 8, padding: '4px 8px', fontSize: 18, cursor: 'pointer',
                          }}>{emoji}</button>
                        ))}
                      </div>
                    </div>

                    {others.length > 0 && (
                      <div>
                        <div style={labelCss}>Sett av</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {others.map(p => (
                            <button key={p.id} onClick={() => toggleSeen(p.id)} style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              background: newSeenBy.includes(p.id) ? '#0A7CFF33' : '#3a3b3c',
                              border: `1.5px solid ${newSeenBy.includes(p.id) ? '#0A7CFF' : 'transparent'}`,
                              borderRadius: 20, padding: '4px 8px 4px 4px', cursor: 'pointer',
                            }}>
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
                    <div>
                      <div style={labelCss}>Mallar</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {systemTemplates.map((tmpl, i) => (
                          <button key={i} onClick={() => setSystemText(tmpl)} style={{
                            background: systemText === tmpl ? '#0A7CFF22' : '#3a3b3c',
                            border: `1px solid ${systemText === tmpl ? '#0A7CFF' : 'transparent'}`,
                            borderRadius: 8, padding: '7px 10px',
                            color: '#b0b3b8', fontSize: 12, cursor: 'pointer', textAlign: 'left',
                          }}>{tmpl}</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={labelCss}>Eller skriv eget</div>
                      <textarea placeholder="Eget systemmeddelande..." value={systemText}
                        onChange={e => setSystemText(e.target.value)} rows={2}
                        style={{ ...inputCss, resize: 'vertical', fontFamily: 'inherit' }} />
                    </div>

                    <div>
                      <div style={labelCss}>Tid (valfritt)</div>
                      <input type="text" placeholder="T.ex. Idag 15:00" value={systemTimestamp}
                        onChange={e => setSystemTimestamp(e.target.value)} style={inputCss} />
                    </div>
                  </>
                )}

                <button onClick={addEvent} disabled={!canAdd} style={{
                  background: canAdd ? '#0A7CFF' : '#3a3b3c',
                  border: 'none', borderRadius: 10, padding: '11px',
                  color: canAdd ? '#fff' : '#65676b',
                  fontSize: 14, fontWeight: 700, cursor: canAdd ? 'pointer' : 'default',
                }}>
                  ➕ Lägg till i konversationen
                </button>

                {events.length > 0 && (
                  <>
                    <div style={{ ...labelCss, marginTop: 8 }}>Historik ({events.length} st)</div>
                    {events.map((ev, i) => {
                      const isMsg = ev.kind === 'message'
                      const msg = ev as MessageEvent
                      const sname = isMsg ? (participants.find(p => p.id === msg.senderId)?.name ?? '?') : ''
                      return (
                        <div key={ev.id} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: '#3a3b3c', borderRadius: 8, padding: '7px 10px',
                        }}>
                          <div style={{ fontSize: 14 }}>{isMsg ? '💬' : '⚙️'}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {isMsg ? (
                              <>
                                <div style={{ color: '#65676b', fontSize: 10 }}>{sname}</div>
                                <div style={{ color: '#e4e6eb', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {msg.imageUrl && !msg.text ? '📷 Bild' : msg.text}
                                </div>
                              </>
                            ) : (
                              <div style={{ color: '#b0b3b8', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {(ev as SystemEvent).text}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 3 }}>
                            {i > 0 && (
                              <button onClick={() => setEvents(prev => {
                                const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a
                              })} style={{ background: 'none', border: 'none', color: '#b0b3b8', cursor: 'pointer', fontSize: 12, padding: 2 }}>↑</button>
                            )}
                            {i < events.length - 1 && (
                              <button onClick={() => setEvents(prev => {
                                const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a
                              })} style={{ background: 'none', border: 'none', color: '#b0b3b8', cursor: 'pointer', fontSize: 12, padding: 2 }}>↓</button>
                            )}
                            <button onClick={() => setEvents(prev => prev.filter(e => e.id !== ev.id))}
                              style={{ background: 'none', border: 'none', color: '#65676b', cursor: 'pointer', fontSize: 14, padding: 2 }}>✕</button>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          <div style={{ padding: '10px 14px', borderTop: '1px solid #3a3b3c', flexShrink: 0 }}>
            <button onClick={() => setPreviewOnly(true)} style={{
              width: '100%', background: '#3a3b3c', border: 'none',
              borderRadius: 8, padding: '9px', color: '#e4e6eb',
              fontSize: 13, cursor: 'pointer', fontWeight: 500,
            }}>
              📸 Skärmbildsläge – dölj redigeraren
            </button>
          </div>
        </div>
      )}

      {/* ════════ PREVIEW AREA ════════ */}
      <div style={{
        flex: 1, overflow: 'auto',
        background: '#f0f2f5',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
      }}>
        {previewOnly && (
          <button onClick={() => setPreviewOnly(false)} style={{
            position: 'fixed', top: 16, left: 16, zIndex: 100,
            background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
            border: '1px solid #ddd', borderRadius: 8,
            padding: '6px 14px', color: '#050505', fontSize: 13,
            cursor: 'pointer', fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            ← Redigera
          </button>
        )}

        <IPhoneFrame>
          <StatusBar />
          <MessengerPreview
            participants={participants}
            events={events}
            conversationName={conversationName}
          />
          <HomeIndicator />
        </IPhoneFrame>
      </div>
    </div>
  )
}
