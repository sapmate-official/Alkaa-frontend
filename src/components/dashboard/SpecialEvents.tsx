import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Gift, Calendar, AlertCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { SpecialEvent } from '@/store/atom'
import RouteDict from '@/routes/RouteDict'

interface SpecialEventsProps {
  events: SpecialEvent[]
  isLoading: boolean
}

export const SpecialEvents: React.FC<SpecialEventsProps> = ({ events, isLoading }) => {
  const navigate = useNavigate()
  const [showAll, setShowAll] = useState(false)
  
  // Limit events shown initially
  const INITIAL_EVENTS_LIMIT = 5
  const eventsToShow = showAll ? events : events.slice(0, INITIAL_EVENTS_LIMIT)
  const hasMoreEvents = events.length > INITIAL_EVENTS_LIMIT

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Special Events & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start space-x-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Special Events & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mb-2 text-muted-foreground/60" />
            <p>No upcoming special events</p>
            <p className="text-sm">Any birthdays, pending approvals, or important reminders will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'BIRTHDAY':
        return <Gift className="h-10 w-10 text-pink-500 p-2 bg-pink-100 rounded-full" />
      case 'BILL':
        return <FileText className="h-10 w-10 text-blue-500 p-2 bg-blue-100 rounded-full" />
      case 'LEAVE_REQUEST':
        return <Calendar className="h-10 w-10 text-green-500 p-2 bg-green-100 rounded-full" />
      case 'MONTH_END_VERIFICATION':
      case 'INCOMPLETE_ATTENDANCE':
        return <AlertCircle className="h-10 w-10 text-amber-500 p-2 bg-amber-100 rounded-full" />
      default:
        return <Bell className="h-10 w-10 text-gray-500 p-2 bg-gray-100 rounded-full" />
    }
  }

  const handleAction = (event: SpecialEvent) => {
    switch (event.type) {
      case 'BIRTHDAY':
        // No action needed for birthdays
        break
      case 'BILL':
        navigate(RouteDict.Dynamic.BillDetails(event.entity.id))
        break
      case 'LEAVE_REQUEST':
        navigate(RouteDict.Leave.Requests.Approval)
        break
      case 'MONTH_END_VERIFICATION':
        navigate(RouteDict.Attendance.Verification)
        break
      case 'INCOMPLETE_ATTENDANCE':
        navigate(RouteDict.Attendance.PastDays)
        break
    }
  }

  const getActionButton = (event: SpecialEvent) => {
    switch (event.type) {
      case 'BIRTHDAY':
        return null // No action needed for birthdays
      case 'BILL':
        return <Button size="sm" onClick={() => handleAction(event)}>View Bill</Button>
      case 'LEAVE_REQUEST':
        return <Button size="sm" onClick={() => handleAction(event)}>Review</Button>
      case 'MONTH_END_VERIFICATION':
        return <Button size="sm" onClick={() => handleAction(event)}>Verify</Button>
      case 'INCOMPLETE_ATTENDANCE':
        return <Button size="sm" onClick={() => handleAction(event)}>Complete</Button>
      default:
        return null
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="ml-2" variant="destructive">Urgent</Badge>
      case 'medium':
        return <Badge className="ml-2" variant="outline">Important</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="h-fit max-h-[400px] flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Bell className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="truncate">Special Events & Notifications</span>
          </CardTitle>
          {events.length > 0 && (
            <Badge variant="secondary" className="ml-2 flex-shrink-0">
              {events.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden">
        <div className={`space-y-3 ${showAll ? 'max-h-80 overflow-y-auto' : 'overflow-hidden'}`}>
          {eventsToShow.map((event, i) => (
            <div key={i} className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors min-w-0">
              <div className="flex-shrink-0">
                {getIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium flex items-center flex-wrap gap-1">
                  <span className="truncate">{event.title}</span>
                  {getPriorityBadge(event.priority)}
                </div>
                <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {event.description}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {format(new Date(event.date), 'PP')}
                </div>
              </div>
              <div className="flex-shrink-0">
                {getActionButton(event)}
              </div>
            </div>
          ))}
        </div>
        
        {hasMoreEvents && (
          <div className="mt-4 pt-3 border-t flex-shrink-0">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show {events.length - INITIAL_EVENTS_LIMIT} More Events
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
