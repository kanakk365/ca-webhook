import HealthCharts from "./health-charts"
import DashboardSection from "./dashboard-section"
import CalendarWidget from "./calendar-widget"
import LiveStream from "./live-stream"
import Gallery from "./gallery"
import ConnectedDevices from "./connected-devices"

export default function Content() {
  return (
    <div className="space-y-6">
      <HealthCharts />

      <DashboardSection />

      <div>
        <CalendarWidget />
      </div>

      <ConnectedDevices />

      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InviteTeam />
        <Announcements />
      </div> */}

      <div className="flex flex-row gap-6 h-[600px]">
        <div className="w-full h-full">
          <LiveStream />
        </div>
      </div>

      <Gallery />
    </div>
  )
}
