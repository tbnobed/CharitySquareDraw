export function BackgroundLogo() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/chicken-poop-bingo-logo.png)',
        backgroundSize: '60% auto',
        opacity: 0.3,
        zIndex: 1,
        mixBlendMode: 'multiply'
      }}
    />
  );
}