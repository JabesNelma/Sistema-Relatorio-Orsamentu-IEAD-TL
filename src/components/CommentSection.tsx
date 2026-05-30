'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Send, User, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/data'
import { useComments, useAddComment } from '@/hooks/use-data'
import { toast } from 'sonner'

interface CommentSectionProps {
  page: 'landing' | 'regional' | 'nasional'
}

export function CommentSection({ page }: CommentSectionProps) {
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const { comments, loading: loadingComments, refetch } = useComments(page)
  const { addComment, loading: submitting } = useAddComment()

  const handleSubmit = async () => {
    if (!author.trim()) {
      toast.error('Hatama naran', {
        description: 'Favor hatama naran ita boot nian',
      })
      return
    }
    if (!content.trim()) {
      toast.error('Hatama komentar', {
        description: 'Favor hatama komentar ita boot nian',
      })
      return
    }

    const result = await addComment(page, author.trim(), content.trim())
    
    if (result) {
      setContent('')
      refetch()
      toast.success('Komentar tau ona!', {
        description: 'Obrigadu ba komentar ita boot nian',
      })
    } else {
      toast.error('Erro', {
        description: 'La bele tau komentar. Tenta fali.',
      })
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50">
            <MessageCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg text-gray-900">Komentar</CardTitle>
            <CardDescription>
              Hatama komentar ita boot nian iha ne'e
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Form */}
        <div className="space-y-3">
          <Input
            placeholder="Naran ita boot..."
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            disabled={submitting}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Hatama komentar..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !submitting && handleSubmit()}
              className="flex-1"
              disabled={submitting}
            />
            <Button 
              onClick={handleSubmit} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="border-t border-gray-200 pt-4">
          <ScrollArea className="h-64">
            {loadingComments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Seidauk iha komentar</p>
                <p className="text-sm">Iha katak komentar dahuluk!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-900 text-sm">
                            {comment.author}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(comment.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
