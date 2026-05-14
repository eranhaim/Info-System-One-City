import MetricCards from '../components/dashboard/MetricCards'
import Charts from '../components/dashboard/Charts'
import EmployeeTable from '../components/dashboard/EmployeeTable'
import InquiryLog from '../components/dashboard/InquiryLog'

export default function DashboardPage() {
  return (
    <div className="h-full overflow-auto bg-gray-50/50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">לוח בקרה</h2>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <MetricCards />
        <Charts />
        <EmployeeTable />
        <InquiryLog />
      </div>
    </div>
  )
}
