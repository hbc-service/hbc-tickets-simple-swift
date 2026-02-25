const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">Dieser Bereich wird bald verfügbar sein.</p>
    </div>
  </div>
);

export default PlaceholderPage;
