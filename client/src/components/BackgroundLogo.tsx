export function BackgroundLogo() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[-1] bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: 'url(/chicken-poop-bingo-logo.png)',
        backgroundSize: '60% auto',
        opacity: 0.5,
        backgroundColor: 'rgba(255, 0, 0, 0.1)' // temporary red background to verify component positioning
      }}
    />
  );
}