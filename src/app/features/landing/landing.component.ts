import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Atelier {
  number: string;
  color: 'red' | 'blue' | 'yellow' | 'green';
  title: string;
  description: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
})
export class LandingComponent implements OnInit {
  /** Charge affichée dans le compteur du hero, animée de 0 au total réel au chargement. */
  displayedLoad = 0;
  private readonly targetLoad = 160;

  ateliers: Atelier[] = [
    {
      number: '01',
      color: 'red',
      title: 'Programmation par ateliers',
      description:
        "Regroupe les exercices en ateliers ou en supersets, avec vidéo de démo, séries, reps et % du 1RM pour chacun.",
    },
    {
      number: '02',
      color: 'blue',
      title: '1RM automatique',
      description:
        "Un seul test (poids × reps) suffit : le 1RM et le tableau de charges de 0% à 100% se calculent seuls (formule de Brzycki).",
    },
    {
      number: '03',
      color: 'yellow',
      title: 'Bien-être avant tout',
      description:
        "Un questionnaire quotidien bloque l'accès aux exercices tant que le joueur n'a pas donné son état du jour.",
    },
    {
      number: '04',
      color: 'green',
      title: 'Ressenti & charge',
      description:
        "RPE par exercice et par séance, notifications en temps réel, courbes de charge pour repérer la fatigue avant la blessure.",
    },
  ];

  ngOnInit(): void {
    this.animateCounter();
  }

  private animateCounter(): void {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.displayedLoad = this.targetLoad;
      return;
    }
    const durationMs = 1400;
    const steps = 40;
    const stepMs = durationMs / steps;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      this.displayedLoad = Math.round((this.targetLoad * step) / steps);
      if (step >= steps) {
        this.displayedLoad = this.targetLoad;
        clearInterval(interval);
      }
    }, stepMs);
  }
}
