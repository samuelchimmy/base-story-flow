export const Hero = () => {
  return (
    <section className="w-full py-6 sm:py-8 md:py-12 text-center border-b border-border">
      <div className="container mx-auto px-4">
        <h1 className="font-bangers text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-2 sm:mb-3">
          <span className="text-primary">Base</span>
          <span className="text-foreground">Story</span>
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-foreground">
          Stories. Alphas. Anonymous. Secured by Base
        </p>
      </div>
    </section>
  );
};
