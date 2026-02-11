import { useState } from 'react'
import { Button } from './ui/button'
import { Share2, Copy, Check, Facebook, Twitter, Linkedin, Mail, MessageCircle, Instagram } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu'
import toast from 'react-hot-toast'

interface ShareAppButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function ShareAppButton({
  variant = 'default',
  size = 'default',
  className = '',
}: ShareAppButtonProps) {
  const [copied, setCopied] = useState(false)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dream-interpreter-ai-app-8lvkkwdq.sites.blink.new'
  const appName = 'Dreamcatcher AI'
  const shareText = `🌙 Unlock the hidden world inside your dreams with ${appName}! Get AI-powered dream interpretations, symbol analysis, and beautiful visualizations. Start free today!`
  
  const encodedText = encodeURIComponent(shareText)
  const encodedUrl = encodeURIComponent(appUrl)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${shareText}\n\n${appUrl}`)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
  }

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    window.open(facebookUrl, '_blank', 'width=600,height=400')
  }

  const shareToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    window.open(linkedInUrl, '_blank', 'width=600,height=400')
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out ${appName}!`)
    const body = encodeURIComponent(`${shareText}\n\n${appUrl}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`
    window.open(whatsappUrl, '_blank')
  }

  const shareToInstagram = () => {
    // Copy to clipboard for Instagram Stories
    navigator.clipboard.writeText(appUrl)
    toast.success('Link copied! Paste in your Instagram story or bio.')
  }

  const shareToTikTok = () => {
    // Copy to clipboard for TikTok
    navigator.clipboard.writeText(`${shareText}\n\n${appUrl}`)
    toast.success('Text copied! Share in your TikTok video or bio.')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`
            ${size === 'lg' ? 'px-6 py-3 text-base font-semibold' : ''}
            ${variant === 'default' ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all' : ''}
            gap-2 ${className}
          `}
          title="Share Dreamcatcher AI with friends"
        >
          <Share2 className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />
          Share App
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Share Dreamcatcher AI with Friends
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-600" />
              <span className="font-medium">Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2 text-primary" />
              <span className="font-medium">Copy Link</span>
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Social Media
        </DropdownMenuLabel>
        
        <DropdownMenuItem onClick={shareToInstagram} className="cursor-pointer">
          <Instagram className="w-4 h-4 mr-2 text-pink-600" />
          <span>Instagram</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareToTikTok} className="cursor-pointer">
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
          <span>TikTok</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareToTwitter} className="cursor-pointer">
          <Twitter className="w-4 h-4 mr-2 text-blue-400" />
          <span>Twitter / X</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareToFacebook} className="cursor-pointer">
          <Facebook className="w-4 h-4 mr-2 text-blue-600" />
          <span>Facebook</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareToLinkedIn} className="cursor-pointer">
          <Linkedin className="w-4 h-4 mr-2 text-blue-700" />
          <span>LinkedIn</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareToWhatsApp} className="cursor-pointer">
          <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
          <span>WhatsApp</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareViaEmail} className="cursor-pointer">
          <Mail className="w-4 h-4 mr-2 text-gray-600" />
          <span>Email</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-2 text-xs text-muted-foreground">
          ✨ Help friends discover the power of dream interpretation
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
