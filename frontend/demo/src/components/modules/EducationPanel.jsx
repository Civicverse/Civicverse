import React, { useState } from 'react'

export default function EducationPanel() {
  const [courses] = useState([
    { name: 'Intro to voting', xp: 50 },
    { name: 'DEX trading 101', xp: 75 },
    { name: 'Governance basics', xp: 100 }
  ])

  return (
    <div className="panel">
      <h3>EDUCATION</h3>
      {courses.map(course => (
        <div key={course.name} className="course-item">
          {course.name}: +{course.xp} XP <button className="small-btn">Start</button>
        </div>
      ))}
    </div>
  )
}
