export function BackgroundLogo() {
  console.log('BackgroundLogo rendering!');
  return (
    <>
      <div 
        className="fixed inset-0 pointer-events-none bg-center bg-no-repeat bg-fixed"
        style={{
          backgroundImage: 'url(/chicken-poop-bingo-logo.png)',
          backgroundSize: '60% auto',
          opacity: 1,
          backgroundColor: 'rgba(255, 0, 0, 0.5)',
          zIndex: -1000
        }}
      />
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: 'yellow',
        padding: '10px',
        zIndex: 9999,
        color: 'black'
      }}>
        Background component is working!
      </div>
    </>
  );
}