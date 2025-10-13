export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎟️ Voucher Management System
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Sistem Manajemen Voucher untuk Toko Jam Tangan
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                🚀 API Endpoints
              </h2>
              <p className="text-gray-600 mb-4">
                Backend API tersedia di <code className="bg-gray-100 px-2 py-1 rounded">/api</code>
              </p>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="font-semibold text-blue-800">Base URL:</p>
                <code className="text-blue-600">http://localhost:3000/api</code>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                📚 Quick Start
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Setup database: <code className="bg-gray-100 px-2 py-1 rounded">npm run db:push</code></li>
                <li>Seed data: <code className="bg-gray-100 px-2 py-1 rounded">npm run db:seed</code></li>
                <li>Login dengan credentials:
                  <ul className="ml-8 mt-2 space-y-1">
                    <li>Username: <code className="bg-gray-100 px-2 py-1 rounded">admin</code></li>
                    <li>Password: <code className="bg-gray-100 px-2 py-1 rounded">admin123</code></li>
                  </ul>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                🔑 Main Endpoints
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Authentication</h3>
                  <code className="text-sm text-green-600">POST /api/auth/login</code>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">Users</h3>
                  <code className="text-sm text-purple-600">POST /api/users</code>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">Transactions</h3>
                  <code className="text-sm text-orange-600">POST /api/transaksi</code>
                </div>
                
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-pink-800 mb-2">Vouchers</h3>
                  <code className="text-sm text-pink-600">POST /api/voucher/validate</code>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                📖 Documentation
              </h2>
              <p className="text-gray-600">
                Lihat <code className="bg-gray-100 px-2 py-1 rounded">README.md</code> untuk dokumentasi lengkap API, business logic, dan testing guide.
              </p>
            </section>

            <section className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Development Mode</h3>
              <p className="text-yellow-700">
                Ini adalah backend API. Gunakan tools seperti Postman, Insomnia, atau cURL untuk testing endpoints.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p>Built with Next.js 14 + Prisma + PostgreSQL</p>
        </div>
      </div>
    </main>
  );
}
