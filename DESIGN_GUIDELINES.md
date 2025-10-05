# Design Guidelines - Messaging Service

## 🎯 **OVERVIEW**

This document provides comprehensive design guidelines for the messaging service, ensuring consistency with the existing Tutor Link platform and delivering an excellent user experience.

## 🎨 **DESIGN PRINCIPLES**

### **Core Principles**
- **Clean and Modern** - Follow existing Tutor Link design patterns
- **Mobile-First** - Responsive design for all screen sizes
- **Accessible** - Proper ARIA labels, keyboard navigation
- **Intuitive** - Easy to use for parents and tutors
- **Fast** - Smooth animations and transitions
- **Consistent** - Match existing platform aesthetics

### **Visual Hierarchy**
- **Primary Actions** - Send message, file upload
- **Secondary Actions** - Emoji picker, settings
- **Tertiary Actions** - Message options, user actions

## 🎨 **COLOR SCHEME**

### **Primary Colors**
```css
/* Primary Blue - Main brand color */
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-50: #eff6ff;
--primary-100: #dbeafe;

/* Secondary Colors */
--secondary-600: #7c3aed;
--secondary-700: #6d28d9;
--secondary-50: #f5f3ff;
--secondary-100: #ede9fe;
```

### **Message Colors**
```css
/* Sent Messages (Own) */
--message-sent-bg: #2563eb;
--message-sent-text: #ffffff;

/* Received Messages (Other) */
--message-received-bg: #f3f4f6;
--message-received-text: #374151;

/* System Messages */
--message-system-bg: #fef3c7;
--message-system-text: #92400e;
```

### **Status Colors**
```css
/* Read Status */
--status-read: #10b981;
--status-delivered: #6b7280;
--status-sent: #9ca3af;

/* Online Status */
--status-online: #10b981;
--status-offline: #6b7280;
--status-away: #f59e0b;
```

## 📱 **RESPONSIVE DESIGN**

### **Breakpoints**
```css
/* Mobile First Approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### **Layout Structure**
```typescript
// Mobile Layout
const MobileLayout = () => (
  <div className="flex flex-col h-screen">
    <ChatHeader />
    <MessageList className="flex-1" />
    <MessageInput />
  </div>
)

// Desktop Layout
const DesktopLayout = () => (
  <div className="flex h-screen">
    <ConversationList className="w-1/3" />
    <div className="flex-1 flex flex-col">
      <ChatHeader />
      <MessageList className="flex-1" />
      <MessageInput />
    </div>
  </div>
)
```

## 💬 **MESSAGE BUBBLE DESIGN**

### **Sent Messages (Own)**
```css
.message-bubble-sent {
  @apply bg-primary-600 text-white rounded-2xl rounded-br-md px-4 py-2 max-w-xs ml-auto;
}

.message-bubble-sent::before {
  content: '';
  position: absolute;
  bottom: 0;
  right: -8px;
  width: 0;
  height: 0;
  border: 8px solid transparent;
  border-left-color: #2563eb;
  border-bottom: none;
}
```

### **Received Messages (Other)**
```css
.message-bubble-received {
  @apply bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md px-4 py-2 max-w-xs mr-auto;
}

.message-bubble-received::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: -8px;
  width: 0;
  height: 0;
  border: 8px solid transparent;
  border-right-color: #f3f4f6;
  border-bottom: none;
}
```

### **Message Timestamps**
```css
.message-timestamp {
  @apply text-xs text-gray-500 mt-1;
}

.message-timestamp-sent {
  @apply text-right;
}

.message-timestamp-received {
  @apply text-left;
}
```

## 📎 **FILE MESSAGE DESIGN**

### **Image Messages**
```typescript
const ImageMessage = ({ imageUrl, caption }: { imageUrl: string; caption?: string }) => (
  <div className="message-bubble">
    <img 
      src={imageUrl} 
      alt="Message image" 
      className="rounded-lg max-w-xs max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
      onClick={() => openImageModal(imageUrl)}
    />
    {caption && (
      <p className="text-sm mt-2">{caption}</p>
    )}
  </div>
)
```

### **File Messages**
```typescript
const FileMessage = ({ fileName, fileSize, fileUrl }: FileMessageProps) => (
  <div className="message-bubble">
    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
      <FileIcon className="w-8 h-8 text-gray-500 mr-3" />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{fileName}</p>
        <p className="text-xs text-gray-500">{formatFileSize(fileSize)}</p>
      </div>
      <a 
        href={fileUrl} 
        download={fileName}
        className="text-primary-600 hover:text-primary-700"
      >
        <DownloadIcon className="w-5 h-5" />
      </a>
    </div>
  </div>
)
```

## 🔔 **NOTIFICATION DESIGN**

### **Message Notifications**
```typescript
const MessageNotification = ({ notification }: { notification: Notification }) => (
  <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-50">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <MessageIcon className="w-6 h-6 text-primary-600" />
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
        <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
        <div className="mt-2 flex space-x-2">
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View
          </button>
          <button className="text-sm text-gray-500 hover:text-gray-700">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  </div>
)
```

### **Badge Counters**
```css
.notification-badge {
  @apply absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center;
}

.unread-count {
  @apply bg-primary-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center;
}
```

## ⌨️ **INPUT DESIGN**

### **Message Input**
```typescript
const MessageInput = () => (
  <div className="flex items-end space-x-2 p-4 bg-white border-t border-gray-200">
    <button className="p-2 text-gray-500 hover:text-gray-700">
      <PaperClipIcon className="w-5 h-5" />
    </button>
    <div className="flex-1 relative">
      <textarea
        placeholder="Type a message..."
        className="w-full px-4 py-2 border border-gray-300 rounded-full resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        rows={1}
        maxRows={4}
      />
    </div>
    <button className="p-2 text-gray-500 hover:text-gray-700">
      <EmojiIcon className="w-5 h-5" />
    </button>
    <button className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700">
      <SendIcon className="w-5 h-5" />
    </button>
  </div>
)
```

### **File Upload**
```typescript
const FileUpload = () => (
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
    <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <p className="text-sm text-gray-600 mb-2">Drag and drop files here</p>
    <p className="text-xs text-gray-500">or</p>
    <button className="text-sm text-primary-600 hover:text-primary-700 mt-2">
      Browse files
    </button>
    <p className="text-xs text-gray-500 mt-2">
      Images: JPG, PNG, GIF (max 5MB)<br />
      Files: PDF, DOC, DOCX (max 10MB)
    </p>
  </div>
)
```

## 🎭 **ANIMATIONS & TRANSITIONS**

### **Message Animations**
```css
/* Message appear animation */
@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-bubble {
  animation: messageAppear 0.3s ease-out;
}

/* Typing indicator animation */
@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.typing-dot {
  animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}
```

### **Loading States**
```typescript
const MessageSkeleton = () => (
  <div className="flex items-start space-x-2 p-4">
    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
    <div className="flex-1">
      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
    </div>
  </div>
)
```

## ♿ **ACCESSIBILITY GUIDELINES**

### **ARIA Labels**
```typescript
const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => (
  <div 
    className="message-bubble"
    role="article"
    aria-label={`Message from ${isOwn ? 'you' : message.sender_name} at ${formatTime(message.created_at)}`}
  >
    <p>{message.content}</p>
    <time 
      className="message-timestamp"
      dateTime={message.created_at}
      aria-label={`Sent at ${formatTime(message.created_at)}`}
    >
      {formatRelativeTime(message.created_at)}
    </time>
  </div>
)
```

### **Keyboard Navigation**
```typescript
const MessageInput = () => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <textarea
      onKeyDown={handleKeyDown}
      aria-label="Type your message"
      aria-describedby="message-help"
    />
  )
}
```

### **Screen Reader Support**
```typescript
const ChatInterface = () => (
  <div 
    role="main"
    aria-label="Chat conversation"
    aria-live="polite"
    aria-atomic="false"
  >
    <MessageList />
    <MessageInput />
  </div>
)
```

## 📱 **MOBILE OPTIMIZATIONS**

### **Touch Targets**
```css
/* Minimum 44px touch targets */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Swipe gestures for message actions */
.message-swipe-actions {
  @apply flex items-center space-x-2;
}

.swipe-action {
  @apply px-4 py-2 rounded-lg text-white;
}

.swipe-action-reply {
  @apply bg-blue-500;
}

.swipe-action-forward {
  @apply bg-green-500;
}

.swipe-action-delete {
  @apply bg-red-500;
}
```

### **Mobile-Specific Features**
```typescript
const MobileChatHeader = () => (
  <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
    <button 
      className="p-2 -ml-2"
      aria-label="Back to conversations"
    >
      <ArrowLeftIcon className="w-6 h-6" />
    </button>
    <div className="flex-1 text-center">
      <h1 className="text-lg font-semibold">John Doe</h1>
      <p className="text-sm text-gray-500">Online</p>
    </div>
    <button className="p-2" aria-label="More options">
      <DotsVerticalIcon className="w-6 h-6" />
    </button>
  </div>
)
```

## 🎨 **ICON USAGE**

### **Message Icons**
```typescript
// Use Heroicons for consistency
import {
  PaperClipIcon,    // File attachment
  EmojiIcon,        // Emoji picker
  SendIcon,         // Send message
  CheckIcon,        // Message sent
  CheckCircleIcon,  // Message read
  ExclamationIcon,  // Message failed
  PhotoIcon,        // Image message
  DocumentIcon,     // File message
  PlayIcon,         // Voice message
  VideoIcon,        // Video call
  PhoneIcon,        // Voice call
  DotsVerticalIcon, // More options
  ArrowLeftIcon,    // Back navigation
  MagnifyingGlassIcon, // Search
  BellIcon,         // Notifications
  CogIcon,          // Settings
} from '@heroicons/react/24/outline'
```

### **Icon Sizes**
```css
/* Standard icon sizes */
.icon-xs { @apply w-3 h-3; }
.icon-sm { @apply w-4 h-4; }
.icon-md { @apply w-5 h-5; }
.icon-lg { @apply w-6 h-6; }
.icon-xl { @apply w-8 h-8; }
```

## 📏 **SPACING & LAYOUT**

### **Spacing Scale**
```css
/* Consistent spacing using Tailwind */
.message-spacing {
  @apply space-y-2; /* 8px between messages */
}

.conversation-spacing {
  @apply space-y-4; /* 16px between conversations */
}

.section-spacing {
  @apply space-y-6; /* 24px between sections */
}
```

### **Container Sizes**
```css
/* Message container max widths */
.message-container {
  max-width: 65%; /* 65% of container width */
}

.message-container-mobile {
  max-width: 85%; /* 85% on mobile for better readability */
}

/* Input container */
.input-container {
  @apply px-4 py-3; /* 16px horizontal, 12px vertical */
}
```

## 🎯 **USER EXPERIENCE PATTERNS**

### **Loading States**
- **Skeleton loaders** for message lists
- **Typing indicators** when someone is typing
- **Progress bars** for file uploads
- **Spinner animations** for API calls

### **Error States**
- **Inline error messages** for failed sends
- **Retry buttons** for failed operations
- **Graceful degradation** for network issues
- **Clear error descriptions** for user actions

### **Empty States**
- **Welcome messages** for new conversations
- **Helpful tips** for first-time users
- **Call-to-action buttons** for starting conversations
- **Illustrations** to make empty states friendly

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintainer**: Development Team
