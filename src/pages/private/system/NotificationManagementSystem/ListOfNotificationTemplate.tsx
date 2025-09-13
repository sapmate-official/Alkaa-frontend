import { Button } from '@/components/ui/button'
import RouteDict from '@/routes/RouteDict'
import { useNavigate } from 'react-router-dom'

const ListOfNotificationTemplate = () => {
    const navigate = useNavigate()
    return (
        <div>
            <Button onClick={() => navigate?.(RouteDict.Notification.TemplateCreate)}>Create Template</Button>
            ListOfNotificationTemplate
        </div>
    )
}

export default ListOfNotificationTemplate