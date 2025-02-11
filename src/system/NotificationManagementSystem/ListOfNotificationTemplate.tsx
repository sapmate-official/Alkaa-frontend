import { Button } from '@/components/ui/button'

import { useNavigate } from 'react-router-dom'

const ListOfNotificationTemplate = () => {
    const navigate = useNavigate()
  return (
    <div>
        <Button onClick={()=>navigate("/p/notification/template/create")}>Create Template</Button>
        ListOfNotificationTemplate</div>
  )
}

export default ListOfNotificationTemplate