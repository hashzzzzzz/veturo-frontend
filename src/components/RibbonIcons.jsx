import {
  PaperAirplaneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'
import { Bars3BottomLeftIcon } from '@heroicons/react/24/solid'
import "./RibbonIcons.css"

function RibbonIcons({ activeFilter, setActiveFilter, language = "en" }) {
  const filterCopy = {
    en: {
      All: "All",
      Airports: "Airports",
      Monthly: "Monthly",
      Cities: "Cities",
      Nearby: "Nearby",
    },
    al: {
      All: "Te gjitha",
      Airports: "Aeroportet",
      Monthly: "Mujore",
      Cities: "Qytetet",
      Nearby: "Afer",
    },
  }[language] || {};

  const filters = [
    { label: 'All', icon: Bars3BottomLeftIcon },
    { label: 'Airports', icon: PaperAirplaneIcon },
    { label: 'Monthly', icon: CalendarDaysIcon },
    { label: 'Cities', icon: BuildingOffice2Icon },
    { label: 'Nearby', icon: MapPinIcon },
  ]

  return (
    <div className="ribbonIcons">
      <div className="ribbonIcons__wrap">
        {filters.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className={`ribbonIcons__item ${
              activeFilter === label ? "active" : ""
            }`}
            onClick={() => setActiveFilter(label)}
          >
            <span className="ribbonIcons__icon">
              <Icon />
            </span>
            <span>{filterCopy[label] || label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default RibbonIcons
