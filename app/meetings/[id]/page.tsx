export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Meeting Detail</h1>
      <p className="text-gray-500 mt-2">Meeting ID: {id}</p>
    </main>
  )
}
