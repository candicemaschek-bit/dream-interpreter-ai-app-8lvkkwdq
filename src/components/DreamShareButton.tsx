import { useState, useMemo } from 'react'
import { Button } from './ui/button'
import { Share2, Copy, Check, Facebook, Twitter, Linkedin, Mail, Image as ImageIcon, Link as LinkIcon, Globe, Loader2, Instagram } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu'
import toast from 'react-hot-toast'
import { detectUserLanguage, getShareTranslations, generateShareText } from '../utils/localization'
import {
  sanitizeForSharing,
  generateShareableLink,
  downloadShareCard,
  copyShareCardToClipboard,
  generateShareCardImage,
  type ShareCardData
} from '../utils/shareCardGenerator'

interface DreamShareButtonProps {
  dreamTitle: string
  dreamDescription: string
  interpretation: string
  dreamId: string
  imageUrl?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function DreamShareButton({
  dreamTitle,
  dreamDescription,
  interpretation,
  dreamId,
  imageUrl,
  variant = 'default',
  size = 'default',
}: DreamShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Detect user language and get translations
  const userLanguage = useMemo(() => detectUserLanguage(), [])
  const t = useMemo(() => getShareTranslations(userLanguage), [userLanguage])

  // Generate proper deep link to interpretation page
  // This URL will automatically serve server-side OG tags to crawlers
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/dream/${dreamId}` 
    : ''
  
  // Generate localized share text
  const shareText = useMemo(
    () => generateShareText(dreamTitle, dreamDescription, interpretation, shareUrl, userLanguage),
    [dreamTitle, dreamDescription, interpretation, shareUrl, userLanguage]
  )
  
  const encodedText = encodeURIComponent(shareText)
  const encodedUrl = encodeURIComponent(shareUrl)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
    setCopied(true)
    toast.success(t.copied)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`
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
    const subject = encodeURIComponent(`${t.emailSubject}: ${dreamTitle}`)
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const shareToInstagram = async () => {
    // Generate image first for Instagram sharing
    setIsGeneratingImage(true)
    try {
      const sanitizedData: ShareCardData = sanitizeForSharing({
        dreamTitle,
        dreamDescription,
        interpretation,
        imageUrl,
        dreamId
      })
      
      const blob = await generateShareCardImage(sanitizedData)
      if (!blob) {
        throw new Error('Failed to generate image')
      }
      
      // Instagram doesn't have a direct web share URL
      // We download the image and copy the caption
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dreamcatcher-${dreamId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Copy caption to clipboard
      const caption = `${shareText}\n\n${shareUrl}`
      await navigator.clipboard.writeText(caption)
      toast.success('Image downloaded! Caption copied to clipboard. Open Instagram app to share.')
    } catch (error) {
      console.error('Error preparing Instagram share:', error)
      toast.error('Failed to prepare Instagram share. Please try again.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const shareToTikTok = async () => {
    // Generate video thumbnail/image for TikTok
    setIsGeneratingImage(true)
    try {
      const sanitizedData: ShareCardData = sanitizeForSharing({
        dreamTitle,
        dreamDescription,
        interpretation,
        imageUrl,
        dreamId
      })
      
      const blob = await generateShareCardImage(sanitizedData)
      if (!blob) {
        throw new Error('Failed to generate image')
      }
      
      // TikTok doesn't have a direct web share URL
      // We download the image and copy the caption
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dreamcatcher-${dreamId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Copy caption to clipboard
      const caption = `${shareText}\n\n${shareUrl}`
      await navigator.clipboard.writeText(caption)
      toast.success('Image downloaded! Caption copied to clipboard. Open TikTok app to share.')
    } catch (error) {
      console.error('Error preparing TikTok share:', error)
      toast.error('Failed to prepare TikTok share. Please try again.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const shareImageOnly = async () => {
    // Download only the dream image without interpretation text
    setIsGeneratingImage(true)
    try {
      if (!imageUrl) {
        toast.error('No dream image available to share')
        return
      }
      
      // Download the original dream image
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dream-image-${dreamId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Dream image downloaded!')
    } catch (error) {
      console.error('Error downloading dream image:', error)
      toast.error('Failed to download image. Please try again.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // Privacy-first sharing functions
  const handleShareAsImage = async () => {
    setIsGeneratingImage(true)
    try {
      // Sanitize data to remove personal information
      const sanitizedData: ShareCardData = sanitizeForSharing({
        dreamTitle,
        dreamDescription,
        interpretation,
        imageUrl,
        dreamId
      })

      // Download the share card
      await downloadShareCard(sanitizedData)
      toast.success('Share card downloaded! No personal details included.')
    } catch (error) {
      console.error('Error generating share card:', error)
      toast.error('Failed to generate share card. Please try again.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleCopyImage = async () => {
    setIsGeneratingImage(true)
    try {
      // Sanitize data to remove personal information
      const sanitizedData: ShareCardData = sanitizeForSharing({
        dreamTitle,
        dreamDescription,
        interpretation,
        imageUrl,
        dreamId
      })

      // Copy to clipboard
      await copyShareCardToClipboard(sanitizedData)
      toast.success('Share card copied to clipboard!')
    } catch (error) {
      console.error('Error copying share card:', error)
      toast.error('Failed to copy image. Your browser may not support this feature.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleCopyShareableLink = () => {
    const link = generateShareableLink(dreamId)
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Shareable link copied! (interpretation only, no personal details)')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`
            ${size === 'lg' ? 'px-6 py-3 text-base font-semibold' : ''}
            ${variant === 'default' ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all' : ''}
            gap-2
          `}
          title="Share this dream with friends and on social media"
        >
          <Share2 className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />
          {t.shareButton}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-start gap-2">
          <Globe className="w-3 h-3 mt-0.5 shrink-0" />
          <span>Share Your Dream</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleCopyShareableLink} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-600" />
              <div className="flex-1">
                <div className="font-medium">Link Copied!</div>
                <div className="text-xs text-muted-foreground">Interpretation only</div>
              </div>
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4 mr-2 text-primary" />
              <div className="flex-1">
                <div className="font-medium">Copy Link</div>
                <div className="text-xs text-muted-foreground">Interpretation only</div>
              </div>
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-start gap-2">
          <Globe className="w-3 h-3 mt-0.5 shrink-0" />
          <span>Social Media</span>
        </DropdownMenuLabel>
        
        <DropdownMenuItem onClick={shareToInstagram} className="cursor-pointer" disabled={isGeneratingImage}>
          <Instagram className="w-4 h-4 mr-2 text-pink-600" />
          <div className="flex-1">
            <div className="font-medium">Instagram</div>
            <div className="text-xs text-muted-foreground">Downloads image + copies caption</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToTikTok} className="cursor-pointer" disabled={isGeneratingImage}>
          {isGeneratingImage ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          )}
          <div className="flex-1">
            <div className="font-medium">TikTok</div>
            <div className="text-xs text-muted-foreground">Downloads image + copies caption</div>
          </div>
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
        <DropdownMenuItem onClick={shareViaEmail} className="cursor-pointer">
          <Mail className="w-4 h-4 mr-2 text-gray-600" />
          <span>Email</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-start gap-2">
          <ImageIcon className="w-3 h-3 mt-0.5 shrink-0" />
          <span>Image Sharing</span>
        </DropdownMenuLabel>
        
        {imageUrl && (
          <DropdownMenuItem onClick={shareImageOnly} className="cursor-pointer" disabled={isGeneratingImage}>
            {isGeneratingImage ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4 mr-2 text-purple-600" />
            )}
            <div className="flex-1">
              <div className="font-medium">Download Dream Image Only</div>
              <div className="text-xs text-muted-foreground">Original image without text</div>
            </div>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-2 text-xs text-muted-foreground">
          🔒 Your personal information is never shared. Only the dream interpretation and visual are included.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
