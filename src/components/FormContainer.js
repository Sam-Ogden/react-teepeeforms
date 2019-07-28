import React, { Component, Children } from 'react'
import { func, arrayOf, instanceOf, bool, number, string, oneOfType } from 'prop-types'
import zenscroll from 'zenscroll'
import is from 'is_js'
import _ from 'lodash'

import formStyle from './FormContainer.css'
import ProgressBar from './ProgressBar'
import SubmitField from './fields/SubmitField'

let fieldContainerRefs = [] // to scroll to the container of a Field
let inputRefs = [] // to focus on the next input of a field
let childrenArr = []

/**
 * @param {Number} i Current position
 * @param {*} length Total length of form
 * @returns {Number} Progress percentage rounded to nearest whole number
 */
const progress = ( i, length ) => Math.round( 100 * ( i ) / length, 0 )

/**
 *
 * @param {Number} i The index of the field in the form
 * @param {Element} Field A field component (e.g. NumberField, DateField etc)
 * @param {Function} onChange The function to call when this Field is changed
 * @param {Function} scrollToRef The function to call to scroll to next field
 * @param {Function} registerValidationError function to register errors with a fields input
 * @returns {Element} The field wrapped in a container
 */
const FieldContainer = ( i, Field, onChange, scrollToRef, registerValidationError ) => (
  <div
    className={formStyle.fieldContainer}
    ref={fieldContainerRefs[ i ]}
    key={i}
  >
    {React.cloneElement( Field, {
      onChange,
      next: () => scrollToRef( i + 1 ),
      refProp: inputRefs[ i ], // Pass ref down to input element for focussing
      registerValidationError,
      fieldIndex: i,
    } )}
  </div>
)

/**
 * Container component for the form
 * Maintains the form state and scrolling behaviour between form fields
 */
export default class FormContainer extends Component {
  static propTypes = {
    onSubmit: func.isRequired, // Function to call upon submission. Accept object as argument.
    children: oneOfType( [ arrayOf( // Array of fields (form body)
      instanceOf( Object ),
    ), instanceOf( Object ) ] ).isRequired,
    showProgress: bool, // Whether to show progress bar
    scrollDuration: number, // Scroll animation time
    edgeOffset: number, // Add offset to scroll to prevent field from being hidden by a header
    submitTitle: string, // Title of the Submit field
    submitDescription: string,
    submitButtonText: string,
  }

  static defaultProps = {
    showProgress: true,
    scrollDuration: 777,
    edgeOffset: 0,
    submitTitle: 'Thank You!',
    submitDescription: '',
    submitButtonText: 'Submit Form',
  }

  componentWillMount = () => {
    const { children, scrollDuration, edgeOffset } = this.props
    const formLength = children.length || 1
    // Create refs for field containers and inputs
    fieldContainerRefs = [ ...Array( formLength + 1 ) ].map( i => React.createRef( i ) )
    inputRefs = [ ...Array( formLength + 1 ) ].map( i => React.createRef( -i ) )
    // Setup scroll behaviour
    zenscroll.setup( scrollDuration, edgeOffset )
    // If single child is passed then convert it to array
    childrenArr = Array.isArray( children ) ? children : Children.toArray( children )
  }

  state = { form: {}, active: 0, errors: {} }

  /**
   *  Handles scrolling between form elements and focus on next input field
   *  Handle scrolling behaviour differently depending on platform
   *  @param {Number} i The index of form elements to scroll to
   */
  scrollToRef = i => {
    const { defaultDuration } = zenscroll.setup()

    if ( i <= childrenArr.length ) {
      if ( is.ios() ) {
        inputRefs[ i ].current.focus()
        if ( i === childrenArr.length ) zenscroll.center( inputRefs[ i ].current )
      } else {
        zenscroll.to( fieldContainerRefs[ i ].current )
        setTimeout( () => { inputRefs[ i ].current.focus() }, defaultDuration - 50 )
      }
    }

    this.setState( { active: i } )
  }

  /**
   * Called by Fields to update the form state in the container
   * @param {String} fieldName The name attribute value of an input field
   * @param {Any} newVal The value to update fieldName to
   */
  onChange = ( fieldName, newVal ) => {
    const { form } = this.state
    this.setState( { form: ( { ...form, [ fieldName ]: newVal } ) } )
  }

  /**
   * Allows fields to register validation errors. This allows checks to occur onSubmit
   * @param {Number} fieldIndex the index of the field in the form with errors
   * @param {Array} err array of strings of errors for given field
   */
  registerValidationError = ( fieldIndex, err ) => {
    const { errors } = this.state
    this.setState( { errors: { ...errors, [ fieldIndex ]: err } } )
  }

  /**
   * Function to run when submit button is hit
   * @returns {Any} onSubmit prop function call
   */
  submit = () => {
    const { onSubmit } = this.props
    const { form, errors } = this.state

    const isValid = _.reduce(
      _.keys( errors ), ( bool, fieldIndex ) => ( bool && errors[ fieldIndex ].length === 0 ), true,
    )

    if ( isValid ) return onSubmit( form )

    // Scroll to first error
    this.scrollToRef( Number.parseInt( _.keys( errors )[ 0 ], 10 ) )
    return false
  }

  render() {
    const {
      showProgress,
      submitTitle,
      submitDescription,
      submitButtonText,
    } = this.props

    const {
      active,
    } = this.state

    const submitComponent = (
      <SubmitField
        onSubmit={this.submit}
        title={submitTitle}
        description={submitDescription}
        buttonText={submitButtonText}
      />
    )

    return (
      <form className={formStyle.formContainer}>
        {childrenArr.map(
          ( Field, i ) => FieldContainer(
            i, Field, this.onChange, this.scrollToRef, this.registerValidationError,
          ),
        )}

        {FieldContainer( childrenArr.length, submitComponent, this.onChange )}

        {showProgress && <ProgressBar progress={progress( active, childrenArr.length )} />}
      </form>
    )
  }
}
