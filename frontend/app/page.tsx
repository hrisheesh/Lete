import HealthCheck from "@/components/HealthCheck";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="py-12 text-center">
        <h2 className="text-4xl font-extrabold mb-4">Welcome to Lete</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          A local-first Adaptive Context Engine for document intelligence. 
        </p>
        <HealthCheck />
      </section>
    </div>
  );
}
